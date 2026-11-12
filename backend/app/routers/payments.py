import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Booking, Payment, Ticket
from ..schemas import PaymentVerifyRequest
from ..services.payment_service import create_razorpay_order, verify_payment
from ..services.qr_service import generate_secure_ticket_token
from ..config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/create-order")
def initiate_payment_order(booking_reference: str, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_reference == booking_reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    order_data = create_razorpay_order(booking.total_amount, booking.booking_reference)
    
    # Record or update payment record
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if not payment:
        payment = Payment(
            booking_id=booking.id,
            razorpay_order_id=order_data["order_id"],
            amount=booking.total_amount,
            payment_status="CREATED",
        )
        db.add(payment)
    else:
        payment.razorpay_order_id = order_data["order_id"]
        payment.payment_status = "CREATED"
    
    db.commit()

    return {
        "order_id": order_data["order_id"],
        "amount": order_data["amount"],
        "currency": "INR",
        "key_id": order_data["key_id"],
        "booking_reference": booking_reference,
    }

@router.post("/verify")
def verify_payment_signature(payload: PaymentVerifyRequest, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.booking_reference == payload.booking_reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")

    is_valid = verify_payment(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tampered or invalid Razorpay signature. Payment rejected."
        )

    # Update payment record
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if payment:
        payment.razorpay_payment_id = payload.razorpay_payment_id
        payment.payment_status = "SUCCESS"
        payment.verified_at = datetime.datetime.utcnow()

    # Confirm booking atomically
    booking.booking_status = "CONFIRMED"

    # Issue unique Ticket
    existing_ticket = db.query(Ticket).filter(Ticket.booking_id == booking.id).first()
    if not existing_ticket:
        total_tickets = db.query(Ticket).count() + 1
        ticket_ref = f"NIE26-{str(total_tickets).zfill(6)}"
        qr_payload, token_hash = generate_secure_ticket_token(ticket_ref)

        new_ticket = Ticket(
            ticket_reference=ticket_ref,
            booking_id=booking.id,
            attendee_student_id=booking.student_id,
            qr_token_hash=token_hash,
            ticket_status="CONFIRMED"
        )
        db.add(new_ticket)
        db.commit()
        db.refresh(new_ticket)
    else:
        new_ticket = existing_ticket
        qr_payload = f"{new_ticket.ticket_reference}-SEC-ACTIVE"

    return {
        "status": "PAYMENT_CONFIRMED",
        "ticket": {
            "ticket_id": new_ticket.ticket_reference,
            "booking_id": booking.booking_reference,
            "full_name": booking.student.full_name,
            "usn": booking.student.usn,
            "branch": booking.student.branch,
            "email": booking.student.email,
            "event_name": settings.EVENT_NAME,
            "event_date": settings.EVENT_DATE,
            "venue": settings.EVENT_VENUE,
            "amount": booking.total_amount,
            "qr_payload": qr_payload,
            "status": new_ticket.ticket_status,
            "issued_at": new_ticket.booking.created_at.isoformat(),
        }
    }

