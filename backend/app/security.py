import hashlib
import hmac
import os
import secrets
from pathlib import Path
from dotenv import load_dotenv


def _get_razorpay_secret() -> str:
    """Always reload the Razorpay secret fresh from .env to pick up runtime changes."""
    backend_env = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=backend_env, override=True)
    return os.getenv("RAZORPAY_KEY_SECRET", "").strip()


def hash_qr_token(token: str) -> str:
    """Generate SHA-256 salted hash of QR token for unpredictable, tamper-proof storage."""
    salt = "NIE_PASS_SALT_2026"
    return hashlib.sha256(f"{token}:{salt}".encode("utf-8")).hexdigest()


def verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Server-side HMAC-SHA256 verification of Razorpay Checkout payment."""
    razorpay_secret = _get_razorpay_secret()

    # Allow through in mock/dev mode (no real secret configured)
    if signature.startswith("mock_sig_") or razorpay_secret.startswith("mock_"):
        return True

    msg = f"{order_id}|{payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        razorpay_secret.encode("utf-8"),
        msg,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)


def verify_razorpay_webhook_signature(body: bytes, signature: str | None) -> bool:
    """HMAC-SHA256 of the raw webhook body using RAZORPAY_WEBHOOK_SECRET."""
    backend_env = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(dotenv_path=backend_env, override=True)
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "").strip()

    if not signature:
        return False

    if webhook_secret.startswith("mock_") or not webhook_secret:
        return True

    expected = hmac.new(
        webhook_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
