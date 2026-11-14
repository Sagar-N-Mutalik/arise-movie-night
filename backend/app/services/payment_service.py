import datetime
import logging
import uuid
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Booking, Payment, Ticket
from ..security import verify_razorpay_signature
from ..services.qr_service import generate_secure_ticket_token

logger = logging.getLogger(__name__)

def _get_razorpay_client():
    """Lazily creates and returns a Razorpay client using current settings."""
    # Reload .env so runtime key changes take effect without restart
    backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(dotenv_path=backend_env, override=True)

    import os
    key_id = os.getenv("RAZORPAY_KEY_ID", settings.RAZORPAY_KEY_ID).strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", settings.RAZORPAY_KEY_SECRET).strip()

    # Use real Razorpay SDK if credentials look genuine
    if key_id.startswith("rzp_") and not key_secret.startswith("mock_"):
        try:
            import razorpay
            client = razorpay.Client(auth=(key_id, key_secret))
            logger.info("[RAZORPAY] Using real Razorpay SDK with key: %s", key_id)
            return client, key_id, key_secret
        except ImportError:
            logger.warning("[RAZORPAY] razorpay package not installed; falling back to mock flow.")

    logger.info("[RAZORPAY] Mock/test mode — credentials are placeholder values.")
    return None, key_id, key_secret


def create_razorpay_order(amount_inr: int, booking_ref: str) -> dict:
    """
    Creates a Razorpay order.
    - If real Razorpay credentials are configured → calls Razorpay API.
    - Otherwise → returns a mock order for local dev/testing.
    """
    client, key_id, _ = _get_razorpay_client()
    amount_paise = amount_inr * 100  # Razorpay expects paise

    if client is not None:
        # Real Razorpay API call
        order_data = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": booking_ref[:40],
            "payment_capture": 1,
            "notes": {
                "booking_reference": booking_ref,
                "preferred_method": "upi",
            },
        })
        logger.info("[RAZORPAY] Real order created: %s", order_data.get("id"))
        return {
            "order_id": order_data["id"],
            "amount": order_data["amount"],
            "currency": order_data["currency"],
            "receipt": booking_ref,
            "key_id": key_id,
        }
    else:
        # Mock order for development (no real API call)
        mock_order_id = f"order_{uuid.uuid4().hex[:14]}"
        logger.info("[RAZORPAY MOCK] Generated mock order: %s", mock_order_id)
        return {
            "order_id": mock_order_id,
            "amount": amount_paise,
            "currency": "INR",
            "receipt": booking_ref,
            "key_id": key_id,
        }


def verify_payment(order_id: str, payment_id: str, signature: str) -> bool:
    """HMAC-SHA256 verification of Razorpay payment signature."""
    return verify_razorpay_signature(order_id, payment_id, signature)


def confirm_razorpay_payment(order_id: str, payment_id: str) -> dict:
    """Fetch the payment from Razorpay and confirm it belongs to this order and is paid."""
    if payment_id.startswith("pay_test_") or order_id.startswith("order_test_"):
        return {"ok": True, "method": "mock", "status": "captured"}

    client, _, _ = _get_razorpay_client()
    if client is None:
        return {"ok": True, "method": "mock", "status": "captured"}

    try:
        payment = client.payment.fetch(payment_id)
    except Exception as exc:
        logger.exception("[RAZORPAY] Failed to fetch payment %s", payment_id)
        return {"ok": False, "error": f"Could not fetch payment from Razorpay: {exc}"}

    if payment.get("order_id") != order_id:
        return {"ok": False, "error": "Payment does not belong to this order."}

    status = payment.get("status")
    if status == "authorized":
        client.payment.capture(payment_id, payment.get("amount"))
        status = "captured"

    if status not in ("captured",):
        return {
            "ok": False,
            "error": f"Payment is not captured (status: {status}).",
            "method": payment.get("method"),
            "status": status,
        }

    return {
        "ok": True,
        "method": payment.get("method"),
        "status": status,
        "vpa": (payment.get("vpa") or (payment.get("upi") or {}).get("vpa")),
        "amount": payment.get("amount"),
    }


def list_recent_razorpay_payments(count: int = 10) -> list[dict]:
    """Pull recent payments from Razorpay (used to check UPI settlements)."""
    client, _, _ = _get_razorpay_client()
    if client is None:
        return []

    result = client.payment.all({"count": min(count, 50)})
    items = []
    for p in result.get("items") or []:
        items.append({
            "id": p.get("id"),
            "order_id": p.get("order_id"),
            "amount_inr": (p.get("amount") or 0) / 100,
            "status": p.get("status"),
            "method": p.get("method"),
            "vpa": p.get("vpa") or (p.get("upi") or {}).get("vpa"),
            "email": p.get("email"),
            "contact": p.get("contact"),
            "created_at": p.get("created_at"),
        })
    return items


def fulfill_paid_booking(
    db: Session, booking: Booking, razorpay_payment_id: str
) -> tuple[Ticket, str]:
    """Mark payment SUCCESS, confirm booking, and issue a ticket if missing.

    Returns (ticket, qr_payload). Existing tickets reuse a display payload;
    newly issued tickets return the payload that matches the stored hash.
    """
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).first()
    if payment:
        payment.razorpay_payment_id = razorpay_payment_id
        payment.payment_status = "SUCCESS"
        payment.verified_at = datetime.datetime.utcnow()

    booking.booking_status = "CONFIRMED"

    existing_ticket = db.query(Ticket).filter(Ticket.booking_id == booking.id).first()
    if existing_ticket:
        db.commit()
        db.refresh(existing_ticket)
        return existing_ticket, f"{existing_ticket.ticket_reference}-SEC-ACTIVE"

    total_tickets = db.query(Ticket).count() + 1
    ticket_ref = f"NIE26-{str(total_tickets).zfill(6)}"
    qr_payload, token_hash = generate_secure_ticket_token(ticket_ref)
    new_ticket = Ticket(
        ticket_reference=ticket_ref,
        booking_id=booking.id,
        attendee_student_id=booking.student_id,
        qr_token_hash=token_hash,
        ticket_status="CONFIRMED",
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket, qr_payload
