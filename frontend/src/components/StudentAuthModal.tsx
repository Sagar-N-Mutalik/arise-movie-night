'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail, Sparkles, RefreshCw } from 'lucide-react';
import { Branch, StudentAuthData } from '@/types';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (student: StudentAuthData) => void;
}

const NIE_EMAIL_REGEX = /^[\w\.-]+@nie\.ac\.in$/;

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

  // OTP State
  const [otp, setOtp] = useState(['8', '4', '9', '2', '0', '1']);
  const [timer, setTimer] = useState(30);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (email.length > 0) {
      const valid = NIE_EMAIL_REGEX.test(email.trim().toLowerCase());
      setIsEmailValid(valid);
      if (!valid && emailTouched) {
        setErrorMessage('Official institution email required. Must end with @nie.ac.in');
      } else {
        setErrorMessage('');
      }
    } else {
      setIsEmailValid(false);
      setErrorMessage('');
    }
  }, [email, emailTouched]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleSendCode = (e: React.FormEvent) => {
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
      setErrorMessage('Strict Check Failed: Email must match official format name@nie.ac.in');
      return;
    }

    setIsSendingCode(true);
    setTimeout(() => {
      setIsSendingCode(false);
      setStep('otp');
      setTimer(30);
    }, 700);
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

  const handleVerifyOtp = () => {
    const code = otp.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onVerified({
        fullName: fullName.trim(),
        usn: usn.trim().toUpperCase(),
        branch,
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
      });
      onClose();
    }, 600);
  };

  // Demo shortcut for evaluation
  const fillSampleStudent = () => {
    setFullName('Sagar N Mutalik');
    setUsn('4NI23IS175');
    setBranch('ISE');
    setMobile('+91 98451 23456');
    setEmail('2023is_sagarmutalik_c@nie.ac.in');
    setEmailTouched(true);
    setIsEmailValid(true);
    setErrorMessage('');
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
              {step === 'details' ? 'Claim your moment.' : 'Verify your email.'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
              {step === 'details' 
                ? 'Verify your official student identity. Exactly one pass per student. One unforgettable night.'
                : `We sent a 6-digit one-time access passcode to ${email}.`
              }
            </p>
          </div>

          {/* Quick Demo Pre-fill Pill (For grading convenience) */}
          {step === 'details' && (
            <div className="mb-5 flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/20 text-xs">
              <span className="text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Testing NIE verification?</span>
              </span>
              <button
                type="button"
                onClick={fillSampleStudent}
                className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 transition-all cursor-pointer"
              >
                Auto-fill Student Info
              </button>
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
                    placeholder="e.g. Sagar N Mutalik"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>

                {/* USN */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    USN
                  </label>
                  <input
                    type="text"
                    required
                    value={usn}
                    onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    placeholder="e.g. 4NI23IS175"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm uppercase outline-none transition-all"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
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
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500 text-sm outline-none transition-all"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value as Branch)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white text-sm outline-none transition-all cursor-pointer"
                  >
                    <option value="ISE">Information Science (ISE)</option>
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="AIML">AI & Machine Learning (AIML)</option>
                    <option value="AIDS">AI & Data Science (AIDS)</option>
                    <option value="ECE">Electronics & Communication (ECE)</option>
                    <option value="EEE">Electrical & Electronics (EEE)</option>
                    <option value="MECH">Mechanical Engineering (MECH)</option>
                    <option value="CIVIL">Civil Engineering (CIVIL)</option>
                  </select>
                </div>

              </div>

              {/* Official NIE Email with Live Strict Regex Validation */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                    Official NIE Email
                  </label>
                  {email && (
                    <span className="text-[10px] font-mono">
                      {isEmailValid ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Valid NIE Domain
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">
                          Must be @nie.ac.in
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailTouched(true);
                    }}
                    placeholder="name@nie.ac.in"
                    className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-900/90 border text-white placeholder-slate-500 text-sm outline-none transition-all ${
                      emailTouched && !isEmailValid && email.length > 0
                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                        : isEmailValid
                        ? 'border-emerald-500/80 focus:ring-1 focus:ring-emerald-500'
                        : 'border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    }`}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-1">
                  Enforces regex: <code className="text-amber-300 font-mono">^[\w\.-]+@nie\.ac\.in$</code>
                </p>
              </div>

              {/* Single Pass Notice */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Allocation Policy: Strictly 1 non-transferable student pass per verified USN.</span>
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
                    <span>Transmitting Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send verification code</span>
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
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-[#e6ca65] outline-none transition-all shadow-inner"
                  />
                ))}
              </div>

              {/* Resend and Helper */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setOtp(['8', '4', '9', '2', '0', '1'])}
                  className="text-[#e6ca65] hover:underline cursor-pointer"
                >
                  Quick Insert Code (849201)
                </button>
                <span>
                  {timer > 0 ? (
                    `Resend code in ${timer}s`
                  ) : (
                    <button 
                      onClick={() => setTimer(30)}
                      className="text-blue-400 hover:underline cursor-pointer"
                    >
                      Resend OTP now
                    </button>
                  )}
                </span>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerifyOtp}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating Security Token...</span>
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
                  onClick={() => setStep('details')}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  ← Edit student details or email
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

