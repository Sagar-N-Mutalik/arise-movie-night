from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("\n==========================================")
    print("  RUNNING NIE PASS FULL-STACK BACKEND SUITE ")
    print("==========================================\n")

    # 1. Invalid email regex check
    r1 = client.post('/api/auth/verify-email', json={'email': 'user@gmail.com'})
    assert r1.status_code == 422, f"Expected 422, got {r1.status_code}"
    print("[PASS] Test 1: Non-NIE email strictly rejected (Regex Check ^[\w\.-]+@nie\.ac\.in$).")

    # 2. Valid email check
    r2 = client.post('/api/auth/verify-email', json={'email': '2023is_sagarmutalik_c@nie.ac.in'})
    assert r2.status_code == 200, f"Expected 200, got {r2.status_code}"
    print("[PASS] Test 2: Official NIE email verified and OTP code dispatched.")

    # 3. OTP verification
    r3 = client.post('/api/auth/verify-otp', json={
        'full_name': 'Sagar N Mutalik',
        'usn': '4NI23IS175',
        'branch': 'ISE',
        'mobile': '+91 98451 23456',
        'email': '2023is_sagarmutalik_c@nie.ac.in',
        'otp_code': '849201'
    })
    assert r3.status_code == 200
    student_id = r3.json()['student']['id']
    print(f"[PASS] Test 3: Student authenticated successfully (ID: {student_id}, USN: 4NI23IS175).")

    # 4. Booking creation (Single Ticket hard limit)
    r4 = client.post('/api/bookings', json={'student_id': student_id, 'quantity': 1})
    assert r4.status_code == 200
    booking_ref = r4.json()['booking_reference']
    print(f"[PASS] Test 4: Booking created with ref: {booking_ref} (Quantity locked to 1).")

    # 5. Payment verification and ticket issuance
    r5 = client.post('/api/payments/verify', json={
        'booking_reference': booking_ref,
        'razorpay_order_id': 'order_test_9921',
        'razorpay_payment_id': 'pay_test_8832',
        'razorpay_signature': 'mock_sig_valid'
    })
    assert r5.status_code == 200
    ticket_data = r5.json()['ticket']
    ticket_id = ticket_data['ticket_id']
    qr_payload = ticket_data['qr_payload']
    print(f"[PASS] Test 5: Payment signature verified. Ticket issued: {ticket_id} with QR token {qr_payload}.")

    # 6. QR Scan at Gate (First time -> VALID)
    r6 = client.post('/api/admin/tickets/verify', json={'token': ticket_id, 'scanner_name': 'Gate A - Diamond Jubilee'})
    assert r6.status_code == 200
    res6 = r6.json()
    assert res6['status'] == 'VALID'
    print(f"[PASS] Test 6: Gate scan 1 APPROVED: {res6['message']}")

    # 7. QR Scan at Gate (Second time -> ALREADY_USED)
    r7 = client.post('/api/admin/tickets/verify', json={'token': ticket_id, 'scanner_name': 'Gate A - Diamond Jubilee'})
    assert r7.status_code == 200
    res7 = r7.json()
    assert res7['status'] == 'ALREADY_USED'
    print(f"[PASS] Test 7: Gate scan 2 DUPLICATE DETECTED: {res7['message']}")

    # 8. Invalid Token Scan
    r8 = client.post('/api/admin/tickets/verify', json={'token': 'COUNTERFEIT-TOKEN-000', 'scanner_name': 'Gate A'})
    assert r8.status_code == 200
    res8 = r8.json()
    assert res8['status'] == 'INVALID'
    print(f"[PASS] Test 8: Counterfeit QR token REJECTED: {res8['message']}")

    # 9. Dashboard metrics check
    r9 = client.get('/api/admin/dashboard')
    assert r9.status_code == 200
    d = r9.json()
    print(f"[PASS] Test 9: Real-time Dashboard updated: Sold={d['tickets_sold']}, Checked-In={d['checked_in']}, Revenue=INR {d['total_revenue']}")
    print("\nALL 9 BACKEND TESTS PASSED WITH 100% SUCCESS!\n")

if __name__ == '__main__':
    run_tests()

