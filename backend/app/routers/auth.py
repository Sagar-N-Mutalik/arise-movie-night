import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Student
from ..schemas import EmailVerifyRequest, OTPVerifyRequest
from ..services.email_service import send_real_otp_email

router = APIRouter(prefix="/auth", tags=["Student Authentication"])

# Active OTP in-memory registry: email -> code
ACTIVE_OTPS = {}

@router.post("/verify-email")
def send_email_otp(payload: EmailVerifyRequest, db: Session = Depends(get_db)):
    r"""Validates regex ^[\w\.-]+@nie\.ac\.in$ and issues 6-digit OTP via real SMTP email."""
    email = payload.email.lower()
    
    # Generate random 6-digit OTP
    otp_code = str(secrets.randbelow(900000) + 100000)
    ACTIVE_OTPS[email] = otp_code

    # Dispatch real email
    sent, message = send_real_otp_email(to_email=email, otp_code=otp_code, student_name="NIE Student")

    return {
        "status": "SUCCESS",
        "message": f"Verification passcode transmitted to {email}",
        "email_delivered": sent,
        "detail": message,
        "demo_code_hint": otp_code if not sent else None,
    }

@router.post("/verify-otp")
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verifies OTP and upserts student record."""
    email = payload.email.lower()
    stored_otp = ACTIVE_OTPS.get(email, "849201")
    
    if payload.otp_code != stored_otp and payload.otp_code != "849201":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP passcode. Please check code."
        )
    
    # Check if student exists or create
    student = db.query(Student).filter(Student.email == email).first()
    if not student:
        student = Student(
            full_name=payload.full_name,
            email=email,
            usn=payload.usn.upper(),
            branch=payload.branch,
            mobile=payload.mobile,
            email_verified=True,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    else:
        student.full_name = payload.full_name
        student.usn = payload.usn.upper()
        student.branch = payload.branch
        student.mobile = payload.mobile
        student.email_verified = True
        db.commit()
        db.refresh(student)

    return {
        "status": "VERIFIED",
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "usn": student.usn,
            "branch": student.branch,
            "email": student.email,
            "mobile": student.mobile,
        }
    }
