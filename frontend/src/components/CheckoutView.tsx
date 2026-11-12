'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, User, ShieldCheck, Lock, CreditCard, Smartphone, Building, RefreshCw, QrCode } from 'lucide-react';
import { StudentAuthData, TicketData } from '@/types';
import { generateNewTicket } from '@/lib/store';

interface CheckoutViewProps {
  student: StudentAuthData;
  onBack: () => void;
  onPaymentSuccess: (ticket: TicketData) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  student,
  onBack,
  onPaymentSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState(`${student.usn.toLowerCase()}@okhdfcbank`);

  const handleInitiatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowRazorpayModal(true);
    }, 450);
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowRazorpayModal(false);
      const ticket = generateNewTicket(student);
      onPaymentSuccess(ticket);
    }, 800);
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

            {/* Constraints Check */}
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

          {/* Refund Policy Card */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Non-refundable booking</span>
              <p className="mt-0.5 leading-relaxed">
                By continuing, you agree to the event terms and refund policy. Tickets are strictly non-transferable and require a matching physical student ID for gate clearance.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Booking Summary Card */}
        <div className="lg:col-span-5">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0c1424] border border-blue-500/30 backdrop-blur-xl shadow-[0_0_35px_rgba(30,58,138,0.25)] space-y-6">
            
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#e6ca65]">
              Booking Summary
            </h4>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-slate-300">
                <span>Student pass × 1</span>
                <span className="font-semibold text-white">₹ 149</span>
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
                  ₹ 149
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
                    <span>Connecting Razorpay...</span>
                  </>
                ) : (
                  <>
                    <span>Pay via Razorpay</span>
                    <span className="text-xs opacity-80">→</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Payment verification endpoint ready (Razorpay Webhook)</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* RAZORPAY PAYMENT SIMULATION MODAL */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-blue-500/40 shadow-2xl overflow-hidden">
            
            {/* Razorpay Header Bar */}
            <div className="bg-[#020617] px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-500 flex items-center justify-center font-bold text-white text-xs">
                  R
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Razorpay Trusted Gateway</div>
                  <div className="text-[10px] text-slate-400">NIE PASS · Movie Night 2026</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#e6ca65]">₹ 149.00</div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="p-6 space-y-5">
              
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('upi')}
                  className={`py-2 rounded-lg font-medium transition-all cursor-pointer ${
                    activePaymentTab === 'upi' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('card')}
                  className={`py-2 rounded-lg font-medium transition-all cursor-pointer ${
                    activePaymentTab === 'card' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setActivePaymentTab('netbanking')}
                  className={`py-2 rounded-lg font-medium transition-all cursor-pointer ${
                    activePaymentTab === 'netbanking' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Netbanking
                </button>
              </div>

              {/* UPI Tab */}
              {activePaymentTab === 'upi' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Virtual Payment Address (VPA)
                    </label>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-transparent text-white text-xs outline-none font-mono"
                        placeholder="yourname@upi"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" /> Scan QR via GPay, PhonePe, Paytm
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {activePaymentTab === 'card' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Card ending in •••• 4242 (Demo)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Visa, Mastercard, RuPay & Diners Club accepted.
                  </div>
                </div>
              )}

              {/* Netbanking Tab */}
              {activePaymentTab === 'netbanking' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span>State Bank of India / HDFC / ICICI</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Direct NIE Education Merchant Account Checkout
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCompletePayment}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Razorpay Signature...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate Successful Payment (₹ 149)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowRazorpayModal(false)}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel transaction
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

