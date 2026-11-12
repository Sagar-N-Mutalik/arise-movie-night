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
    r"""Validates email and issues a 6-digit OTP code directly to the entered email address via SMTP."""
    email = payload.email.lower()
    
    # Generate random 6-digit OTP
    otp_code = str(secrets.randbelow(900000) + 100000)
    ACTIVE_OTPS[email] = otp_code

    # Dispatch real email to the entered email address
    sent, message = send_real_otp_email(to_email=email, otp_code=otp_code, student_name="Student")

    if not sent:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to send verification code to {email}. {message}"
        )

    return {
        "status": "SUCCESS",
        "message": f"Verification code successfully sent to {email}",
        "email_delivered": True,
        "detail": message,
    }

@router.post("/verify-otp")
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verifies that the entered OTP matches the code sent to the email and upserts student record."""
    email = payload.email.lower().strip()
    stored_otp = ACTIVE_OTPS.get(email)
    
    if not stored_otp or payload.otp_code.strip() != stored_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code. Please enter the exact code sent to your email."
        )

    target_usn = payload.usn.strip().upper()
    
    # Check if student already exists by email or by USN
    student_by_email = db.query(Student).filter(Student.email == email).first()
    student_by_usn = db.query(Student).filter(Student.usn == target_usn).first()

    if student_by_email and student_by_usn and student_by_email.id != student_by_usn.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"USN '{target_usn}' is already registered to a different student profile. Each student must use their own USN."
        )

    student = student_by_email or student_by_usn
    if not student:
        student = Student(
            full_name=payload.full_name,
            email=email,
            usn=target_usn,
            branch=payload.branch,
            mobile=payload.mobile,
            email_verified=True,
        )
        db.add(student)
    else:
        student.full_name = payload.full_name
        student.email = email
        student.usn = target_usn
        student.branch = payload.branch
        student.mobile = payload.mobile
        student.email_verified = True

    try:
        db.commit()
        db.refresh(student)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database update failed: {str(e)}"
        )
    # Invalidate OTP only AFTER successful DB commit
    ACTIVE_OTPS.pop(email, None)

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
