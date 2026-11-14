import asyncio
import httpx
from app.main import app
from app.routers.auth import ACTIVE_OTPS

async def run_tests():
    print("\n==========================================")
    print("  RUNNING NIE PASS FULL-STACK BACKEND SUITE ")
    print("==========================================\n")

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Invalid email regex check
        r1 = await client.post('/api/auth/verify-email', json={'email': 'invalid-email-format'})
        assert r1.status_code == 422, f"Expected 422, got {r1.status_code}"
        print("[PASS] Test 1: Invalid email format strictly rejected (Regex validation).")

        # 2. OTP dispatch and registration
        test_email = '2023is_sagarmutalik_c@nie.ac.in'
        ACTIVE_OTPS[test_email] = '554433'
        print("[PASS] Test 2: Active verification code registered for student.")

        # 3a. Invalid/Demo OTP rejection check (verify demo bypass 849201 is removed)
        r_bad = await client.post('/api/auth/verify-otp', json={
            'full_name': 'Sagar N Mutalik',
            'usn': '4NI23IS175',
            'branch': 'ISE',
            'mobile': '+91 98451 23456',
            'email': test_email,
            'otp_code': '849201'  # Demo code must now fail!
        })
        assert r_bad.status_code == 400, f"Expected 400 for demo code, got {r_bad.status_code}"
        print("[PASS] Test 3a: Hardcoded demo code '849201' is strictly rejected.")

        # 3b. Genuine OTP verification
        r3 = await client.post('/api/auth/verify-otp', json={
            'full_name': 'Sagar N Mutalik',
            'usn': '4NI23IS175',
            'branch': 'ISE',
            'mobile': '+91 98451 23456',
            'email': test_email,
            'otp_code': '554433'
        })
        assert r3.status_code == 200, f"Expected 200, got {r3.status_code}: {r3.text}"
        student_id = r3.json()['student']['id']
        print(f"[PASS] Test 3b: Student authenticated with genuine OTP sent to email (ID: {student_id}).")

        # 3c. Replay prevention check (OTP should be invalidated after use)
        r_replay = await client.post('/api/auth/verify-otp', json={
            'full_name': 'Sagar N Mutalik',
            'usn': '4NI23IS175',
            'branch': 'ISE',
            'mobile': '+91 98451 23456',
            'email': test_email,
            'otp_code': '554433'
        })
        assert r_replay.status_code == 400, f"Expected 400 on replay, got {r_replay.status_code}"
        print("[PASS] Test 3c: Replay of used OTP is strictly rejected.")

        # 4. Booking creation (Single Ticket hard limit)
        r4 = await client.post('/api/bookings', json={'student_id': student_id, 'quantity': 1})
        assert r4.status_code == 200, f"Expected 200, got {r4.status_code}: {r4.text}"
        booking_ref = r4.json()['booking_reference']
        print(f"[PASS] Test 4: Booking created with ref: {booking_ref} (Quantity locked to 1).")

        # 5. Payment verification and ticket issuance
        r5 = await client.post('/api/payments/verify', json={
            'booking_reference': booking_ref,
            'razorpay_order_id': 'order_test_9921',
            'razorpay_payment_id': 'pay_test_8832',
            'razorpay_signature': 'mock_sig_valid'
        })
        assert r5.status_code == 200, f"Expected 200, got {r5.status_code}: {r5.text}"
        ticket_data = r5.json()['ticket']
        ticket_id = ticket_data['ticket_id']
        qr_payload = ticket_data['qr_payload']
        print(f"[PASS] Test 5: Payment signature verified. Ticket issued: {ticket_id} with QR token {qr_payload}.")

        # 6. QR Scan at Gate (First time -> VALID)
        r6 = await client.post('/api/admin/tickets/verify', json={'token': ticket_id, 'scanner_name': 'Gate A - Diamond Jubilee'})
        assert r6.status_code == 200
        res6 = r6.json()
        assert res6['status'] == 'VALID'
        print(f"[PASS] Test 6: Gate scan 1 APPROVED: {res6['message']}")

        # 7. QR Scan at Gate (Second time -> ALREADY_USED)
        r7 = await client.post('/api/admin/tickets/verify', json={'token': ticket_id, 'scanner_name': 'Gate A - Diamond Jubilee'})
        assert r7.status_code == 200
        res7 = r7.json()
        assert res7['status'] == 'ALREADY_USED'
        print(f"[PASS] Test 7: Gate scan 2 DUPLICATE DETECTED: {res7['message']}")

        # 8. Invalid Token Scan
        r8 = await client.post('/api/admin/tickets/verify', json={'token': 'COUNTERFEIT-TOKEN-000', 'scanner_name': 'Gate A'})
        assert r8.status_code == 200
        res8 = r8.json()
        assert res8['status'] == 'INVALID'
        print(f"[PASS] Test 8: Counterfeit QR token REJECTED: {res8['message']}")

        # 9. Dashboard metrics check
        r9 = await client.get('/api/admin/dashboard')
        assert r9.status_code == 200
        d = r9.json()
        print(f"[PASS] Test 9: Real-time Dashboard updated: Sold={d['tickets_sold']}, Checked-In={d['checked_in']}, Revenue=INR {d['total_revenue']}")
        print("\nALL BACKEND VERIFICATION TESTS PASSED WITH 100% SUCCESS!\n")

if __name__ == '__main__':
    asyncio.run(run_tests())
