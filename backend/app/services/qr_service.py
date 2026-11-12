import secrets
from ..security import hash_qr_token

def generate_secure_ticket_token(ticket_reference: str) -> tuple[str, str]:
    """
    Returns (raw_qr_payload, token_hash)
    Raw payload is encoded into QR image.
    Hash is stored in the database.
    """
    rand_entropy = secrets.token_hex(8).upper()
    qr_payload = f"{ticket_reference}-SEC-{rand_entropy}"
    token_hash = hash_qr_token(qr_payload)
    return qr_payload, token_hash

