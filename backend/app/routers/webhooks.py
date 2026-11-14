import json

from fastapi import APIRouter, Request, Header, HTTPException, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import WebhookEvent, Booking, Payment
from ..security import verify_razorpay_webhook_signature
from ..services.payment_service import fulfill_paid_booking

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/razorpay")
async def handle_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db),
):
    """Server-side Razorpay webhook: verify signature, then reconcile payment."""
    body_bytes = await request.body()

    if not verify_razorpay_webhook_signature(body_bytes, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay webhook signature")

    try:
        data = json.loads(body_bytes.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    event_type = data.get("event", "unknown")
    payload = data.get("payload") or {}
    payment_entity = (payload.get("payment") or {}).get("entity") or {}
    order_entity = (payload.get("order") or {}).get("entity") or {}
    payment_id = payment_entity.get("id") or ""
    order_id = payment_entity.get("order_id") or order_entity.get("id") or ""
    created_at = data.get("created_at", "")
    event_id = data.get("id") or f"{event_type}_{payment_id}_{created_at}"

    existing = db.query(WebhookEvent).filter(WebhookEvent.provider_event_id == event_id).first()
    if existing:
        return {"status": "ALREADY_PROCESSED"}

    webhook_record = WebhookEvent(
        provider_event_id=event_id,
        event_type=event_type,
        processing_status="RECEIVED",
    )
    db.add(webhook_record)
    db.commit()

    if event_type in ("payment.captured", "order.paid") and order_id:
        payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        if payment:
            booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
            if booking:
                fulfill_paid_booking(db, booking, payment_id or payment.razorpay_payment_id or "")
    elif event_type == "payment.failed" and order_id:
        payment = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        if payment and payment.payment_status != "SUCCESS":
            payment.payment_status = "FAILED"
            payment.razorpay_payment_id = payment_id or payment.razorpay_payment_id
            booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
            if booking and booking.booking_status == "PENDING":
                booking.booking_status = "PAYMENT_FAILED"
            db.commit()

    db.query(WebhookEvent).filter(WebhookEvent.id == webhook_record.id).update(
        {"processing_status": "PROCESSED"}
    )
    db.commit()

    return {"status": "SUCCESS", "event": event_type}
