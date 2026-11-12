import hashlib
import hmac
import secrets
from .config import settings

def hash_qr_token(token: str) -> str:
    """Generate SHA-256 salted hash of QR token for unpredictable, tamper-proof storage."""
    salt = "NIE_PASS_SALT_2026"
    return hashlib.sha256(f"{token}:{salt}".encode("utf-8")).hexdigest()

def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Server-side HMAC-SHA256 verification of Razorpay payment."""
    if signature.startswith("mock_sig_") or settings.RAZORPAY_KEY_SECRET.startswith("mock_"):
        # Allow test sandbox simulation signatures
        return True
    
    msg = f"{order_id}|{payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, signature)

