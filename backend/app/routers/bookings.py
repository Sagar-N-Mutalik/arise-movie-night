import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Booking, Student, Event
from ..schemas import CreateOrderRequest
from ..config import settings

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.post("")
def create_booking(payload: CreateOrderRequest, db: Session = Depends(get_db)):
    """Creates temporary booking and reserves 1 ticket for student."""
    # Check student
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    # BR-02: Check if student already has a confirmed or pending booking
    existing_booking = db.query(Booking).filter(
        Booking.student_id == student.id,
        Booking.booking_status.in_(["CONFIRMED", "PENDING"])
    ).first()

    if existing_booking:
        raise HTTPException(
            status_code=400,
            detail="Single Ticket Quota Exceeded: You already have an active ticket booking for NIE Movie Night 2026."
        )

    # Check capacity
    confirmed_count = db.query(Booking).filter(Booking.booking_status == "CONFIRMED").count()
    if confirmed_count >= settings.MAX_CAPACITY:
        raise HTTPException(
            status_code=400,
            detail="Sold Out: Movie Night 2026 auditorium has reached maximum student capacity (500/500)."
        )

    booking_ref = f"BK-{uuid.uuid4().hex[:8].upper()}"
    new_booking = Booking(
        booking_reference=booking_ref,
        student_id=student.id,
        event_id=settings.EVENT_ID,
        quantity=1, # Hard single-ticket rule
        total_amount=settings.TICKET_PRICE_INR,
        booking_status="PENDING",
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    )

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return {
        "booking_reference": new_booking.booking_reference,
        "quantity": 1,
        "amount": new_booking.total_amount,
        "expires_in_minutes": 10,
        "student": {
            "name": student.full_name,
            "usn": student.usn,
            "email": student.email,
        }
    }

@router.get("/{booking_reference}")
def get_booking_details(booking_reference: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_reference == booking_reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking reference not found.")
    return {
        "booking_reference": booking.booking_reference,
        "status": booking.booking_status,
        "amount": booking.total_amount,
        "created_at": booking.created_at.isoformat(),
        "student": {
            "name": booking.student.full_name,
            "usn": booking.student.usn,
            "branch": booking.student.branch,
        }
    }

