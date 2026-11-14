'use client';

import React, { useState } from 'react';
import {
  ArrowLeft, CheckCircle2, User, ShieldCheck, Lock, RefreshCw,
} from 'lucide-react';
import { StudentAuthData, TicketData } from '@/types';

interface CheckoutViewProps {
  student: StudentAuthData;
  onBack: () => void;
  onPaymentSuccess: (ticket: TicketData) => void;
}

const API_BASE = (import.meta as ImportMeta).env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const TICKET_PRICE = 49;

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  student,
  onBack,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleInitiatePayment = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      // ── Step 1: Create a booking ──────────────────────────────────────────
      const bookingRes = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: student.id }),
      });

      if (!bookingRes.ok) {
        const err = await bookingRes.json();
        throw new Error(err.detail || 'Failed to create booking.');
      }
      const booking = await bookingRes.json();
      const bookingReference: string = booking.booking_reference;

      // ── Step 2: Create Razorpay order ────────────────────────────────────
      const orderRes = await fetch(
        `${API_BASE}/api/payments/create-order?booking_reference=${bookingReference}`,
        { method: 'POST' }
      );

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.detail || 'Failed to create Razorpay order.');
      }
      const orderData = await orderRes.json();

      // ── Step 3: Open Razorpay Checkout ───────────────────────────────────
      const rzpKeyId: string = orderData.key_id ||
        (import.meta as ImportMeta).env.VITE_RAZORPAY_KEY_ID || '';

      const rzpOptions = {
        key: rzpKeyId,
        amount: orderData.amount,          // in paise
        currency: 'INR',
        name: 'ArISE 2026 Movie Night',
        description: 'Student Admission Pass · NIE Mysuru',
        order_id: orderData.order_id,
        prefill: {
          name: student.fullName,
          email: student.email,
          contact: (student.mobile || '').replace(/\s+/g, ''),
          method: 'upi',
        },
        config: {
          display: {
            blocks: {
              upi_only: {
                name: 'Pay using UPI',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['qr', 'intent', 'collect'],
                    apps: ['google_pay', 'phonepe', 'paytm', 'bhim'],
                  },
                ],
              },
            },
            sequence: ['block.upi_only', 'upi'],
            preferences: {
              show_default_blocks: false,
            },
            hide: [
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'wallet' },
              { method: 'emi' },
              { method: 'paylater' },
            ],
          },
        },
        theme: { color: '#2563eb' },

        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // ── Step 4: Verify payment on backend ──────────────────────────
          try {
            const verifyRes = await fetch(`${API_BASE}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                booking_reference: bookingReference,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.detail || 'Payment verification failed.');
            }

            const result = await verifyRes.json();
            const t = result.ticket;

            // ── Step 5: Return ticket to parent ────────────────────────
            onPaymentSuccess({
              ticketId: t.ticket_id,
              bookingId: t.booking_id,
              fullName: t.full_name,
              usn: t.usn,
              branch: t.branch,
              email: t.email,
              mobile: student.mobile,
              eventName: t.event_name,
              eventDate: t.event_date,
              venue: t.venue,
              amount: t.amount,
              qrPayload: t.qr_payload,
              status: t.status,
              issuedAt: t.issued_at,
            });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setErrorMsg(`Payment verification failed: ${msg}`);
            setIsProcessing(false);
          }
        },

        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setErrorMsg('Payment was cancelled.');
          },
        },
      };

      // Load Razorpay checkout.js dynamically if not already loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK.'));
          document.head.appendChild(script);
        });
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }
      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', (failed: unknown) => {
        const detail = failed as { error?: { description?: string } };
        setErrorMsg(detail.error?.description || 'UPI payment failed. Please try again.');
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-center animate-in fade-in duration-300">

      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors self-start cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to details</span>
      </button>

      {/* Page Header */}
      <div className="mb-10">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#e6ca65]">
          Final Transmission
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif text-white tracking-tight mt-1">
          Confirm your <span className="italic text-[#e6ca65]">pass.</span>
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Your identity is verified. Review your details before completing this payment.
        </p>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Student Details Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-[#0d1628]/80 border border-slate-700/60 backdrop-blur-xl relative overflow-hidden shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {student.fullName}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {student.usn} · {student.branch}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 font-mono">
                    {student.email}
                  </div>
                </div>
              </div>
              {/* Verified Badge */}
              <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Verified NIE Student">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Student Status</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> NIE Verified
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Ticket Quota</span>
                <span className="text-white font-medium mt-0.5 block">
                  1 Pass (Hard limit enforced)
                </span>
              </div>
            </div>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Refund Policy */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Non-refundable booking</span>
              <p className="mt-0.5 leading-relaxed">
                By continuing, you agree to the event terms and refund policy. Tickets are strictly
                non-transferable and require a matching physical student ID for gate clearance.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Booking Summary */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0c1424] border border-blue-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(30,58,138,0.25)] space-y-6">

            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#e6ca65]">
              Booking Summary
            </h4>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Student pass × 1</span>
                <span className="font-semibold text-white">₹ {TICKET_PRICE}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-xs">
                <span>Convenience fee</span>
                <span className="text-emerald-400 font-medium">Included</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-xs">
                <span>GST (18%)</span>
                <span className="text-emerald-400 font-medium">Included</span>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-semibold text-white text-base">Total payable</span>
                <span className="text-3xl font-serif font-bold text-[#e6ca65]">
                  ₹ {TICKET_PRICE}
                </span>
              </div>
            </div>

            {/* Razorpay Button */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:shadow-[0_0_35px_rgba(59,130,246,0.7)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Opening Razorpay...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{TICKET_PRICE} with UPI</span>
                    <span className="text-xs opacity-80">→</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>UPI QR / GPay / PhonePe — enable UPI in Razorpay Dashboard if it is missing</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
