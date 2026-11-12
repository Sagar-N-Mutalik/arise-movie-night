import uuid
from ..config import settings
from ..security import verify_razorpay_signature

def create_razorpay_order(amount_inr: int, booking_ref: str) -> dict:
    """Create order object for Razorpay checkout."""
    amount_paise = amount_inr * 100
    mock_order_id = f"order_{uuid.uuid4().hex[:14]}"
    return {
        "order_id": mock_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "receipt": booking_ref,
        "key_id": settings.RAZORPAY_KEY_ID,
    }

def verify_payment(order_id: str, payment_id: str, signature: str) -> bool:
    return verify_razorpay_signature(order_id, payment_id, signature)

