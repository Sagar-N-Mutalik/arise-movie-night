'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail, RefreshCw } from 'lucide-react';
import { Branch, StudentAuthData } from '@/types';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (student: StudentAuthData) => void;
}

const EMAIL_REGEX = /^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/;

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  // Step: 'details' or 'otp'
  const [step, setStep] = useState<'details' | 'otp'>('details');

  // Form State
  const [fullName, setFullName] = useState('');
  const [usn, setUsn] = useState('');
  const [branch, setBranch] = useState<Branch>('ISE');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  // Email Validation State
  const [emailTouched, setEmailTouched] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // OTP State - strictly starts empty, no demo code
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (email.length > 0) {
      const valid = EMAIL_REGEX.test(email.trim().toLowerCase());
      setIsEmailValid(valid);
      if (!valid && emailTouched) {
        setErrorMessage('Please enter a valid email address.');
      } else {
        setErrorMessage('');
      }
    } else {
      setIsEmailValid(false);
      setErrorMessage('');
    }
  }, [email, emailTouched]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const sendOtpRequest = async () => {
    setErrorMessage('');
    setInfoMessage('');
    setIsSendingCode(true);

    const targetEmail = email.trim().toLowerCase();

    try {
      // First try relative path (proxied by Vite)
      let res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      }).catch(() => null);

      // If relative failed or wasn't reachable, try direct localhost backend
      if (!res || !res.ok) {
        const fallbackRes = await fetch('http://127.0.0.1:8000/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail }),
        }).catch(() => null);

        if (fallbackRes) {
          res = fallbackRes;
        }
      }

      if (!res) {
        throw new Error('Unable to connect to backend server. Please verify backend is running on port 8000.');
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to dispatch verification email.');
      }

      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      setTimer(60);
      setInfoMessage(`Verification code sent to ${targetEmail}. Please check your inbox and spam folder.`);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending verification code.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name as on student ID.');
      return;
    }
    if (!usn.trim()) {
      setErrorMessage('Please enter your valid NIE USN (e.g., 4NI23IS175).');
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      setErrorMessage('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    await sendOtpRequest();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto advance focus
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      nextOtp[i] = pasted[i];
    }
    setOtp(nextOtp);

    const targetIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[targetIdx]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('').trim();
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code sent to your email.');
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);

    const payload = {
      full_name: fullName.trim(),
      usn: usn.trim().toUpperCase(),
      branch,
      mobile: mobile.trim(),
      email: email.trim().toLowerCase(),
      otp_code: code,
    };

    try {
      let res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (!res || !res.ok) {
        const fallbackRes = await fetch('http://127.0.0.1:8000/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => null);

        if (fallbackRes) {
          res = fallbackRes;
        }
      }

      if (!res) {
        throw new Error('Unable to connect to backend server. Please verify backend is running on port 8000.');
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid or expired verification code.');
      }

      onVerified({
        id: data.student.id,
        fullName: fullName.trim(),
        usn: usn.trim().toUpperCase(),
        branch,
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. Please check the code sent to your email.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0c1424] border border-blue-500/20 shadow-[0_0_50px_rgba(30,58,138,0.35)] overflow-hidden">
        
        {/* Glow Accent Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-blue-500 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          
          {/* Header Title */}
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#e6ca65]">
              NIE Student Gate
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif text-white tracking-tight mt-1">
              {step === 'details' ? 'Claim your moment.' : 'Enter Verification Code'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
              {step === 'details' 
                ? 'Verify your official student identity. Exactly one pass per student. One unforgettable night.'
                : `Enter the 6-digit passcode sent to ${email}. Check your inbox and spam folder.`
              }
            </p>
          </div>

          {/* Info Banner */}
          {infoMessage && (
            <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Student Details Form */}
          {step === 'details' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sagar N Mutalik"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-sm outline-none transition-all shadow-inner"
                  />
                </div>

                {/* USN */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    NIE USN
                  </label>
                  <input
                    type="text"
                    required
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    placeholder="4NI23IS175"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-sm uppercase font-mono outline-none transition-all shadow-inner"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Academic Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value as Branch)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white text-sm outline-none transition-all shadow-inner cursor-pointer"
                  >
                    <option value="ISE">Information Science & Engg (ISE)</option>
                    <option value="CSE">Computer Science & Engg (CSE)</option>
                    <option value="AIML">Artificial Intelligence & ML (AIML)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="EEE">Electrical & Electronics (EEE)</option>
                    <option value="MECH">Mechanical Engineering (MECH)</option>
                    <option value="CIVIL">Civil Engineering (CIVIL)</option>
                  </select>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98451 23456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-white placeholder-slate-500 text-sm outline-none transition-all shadow-inner"
                  />
                </div>

              </div>

              {/* Institution Email */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    Email Address
                  </label>
                  {emailTouched && (
                    <span className="text-[10px] flex items-center gap-1">
                      {isEmailValid ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Valid format
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium">
                          Valid email required
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="student@nie.ac.in"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border text-white placeholder-slate-500 text-sm outline-none transition-all shadow-inner ${
                      emailTouched
                        ? isEmailValid
                          ? 'border-emerald-500/60 focus:border-emerald-400'
                          : 'border-red-500/60 focus:border-red-400'
                        : 'border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  The verification code will be sent to this email address.
                </p>
              </div>

              {/* Security Badge */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#e6ca65] shrink-0" />
                <span className="leading-snug">
                  Strict academic rule: Each email is entitled to exactly 1 non-transferable pass.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSendingCode || !isEmailValid}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSendingCode ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Verification Code to Email...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-6 animate-in fade-in">
              
              <div className="flex justify-center gap-2.5 sm:gap-3 py-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    placeholder="•"
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-[#e6ca65] outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              {/* Resend and Helper */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="text-slate-400">
                  Didn't receive code?
                </span>
                <span>
                  {timer > 0 ? (
                    `Resend code in ${timer}s`
                  ) : (
                    <button 
                      type="button"
                      disabled={isSendingCode}
                      onClick={sendOtpRequest}
                      className="text-blue-400 hover:underline cursor-pointer font-medium"
                    >
                      {isSendingCode ? 'Sending...' : 'Resend code now'}
                    </button>
                  )}
                </span>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isVerifying || otp.join('').length < 6}
                  onClick={handleVerifyOtp}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Verify & Proceed to Checkout</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setInfoMessage('');
                    setStep('details');
                  }}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  ← Edit details or change email
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
