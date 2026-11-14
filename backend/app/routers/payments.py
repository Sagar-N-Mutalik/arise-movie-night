from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Booking, Payment
from ..schemas import PaymentVerifyRequest
from ..services.payment_service import (
    confirm_razorpay_payment,
    create_razorpay_order,
    fulfill_paid_booking,
    list_recent_razorpay_payments,
    verify_payment,
)
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

    payment_row = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if payment_row and payment_row.razorpay_order_id != payload.razorpay_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID does not match this booking.",
        )

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

    captured = confirm_razorpay_payment(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
    )
    if not captured.get("ok"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=captured.get("error") or "Razorpay payment is not captured.",
        )

    new_ticket, qr_payload = fulfill_paid_booking(
        db, booking, payload.razorpay_payment_id
    )

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
        },
        "payment_method": captured.get("method"),
        "upi_vpa": captured.get("vpa"),
    }


@router.get("/recent")
def recent_payments(count: int = Query(default=10, ge=1, le=50)):
    """Check recent Razorpay payments (UPI method, status, amount)."""
    razorpay_items = list_recent_razorpay_payments(count)
    return {
        "source": "razorpay",
        "count": len(razorpay_items),
        "payments": razorpay_items,
    }


@router.get("/local")
def local_payments(db: Session = Depends(get_db)):
    """Check payments recorded in this app's database."""
    rows = db.query(Payment).order_by(Payment.id.desc()).limit(50).all()
    return {
        "source": "local",
        "count": len(rows),
        "payments": [
            {
                "id": p.id,
                "booking_id": p.booking_id,
                "razorpay_order_id": p.razorpay_order_id,
                "razorpay_payment_id": p.razorpay_payment_id,
                "amount_inr": p.amount,
                "status": p.payment_status,
                "verified_at": p.verified_at.isoformat() if p.verified_at else None,
            }
            for p in rows
        ],
    }

