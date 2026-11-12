'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDateISO?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDateISO = '2026-11-18T18:00:00+05:30',
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 6,
    hours: 3,
    minutes: 8,
    seconds: 27,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetDateISO).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateISO]);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="w-full border-y border-white/5 bg-[#090e1a]/60 backdrop-blur-md py-10 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left Headline */}
        <div>
          <span className="text-xs uppercase tracking-widest text-[#e6ca65] font-semibold block mb-2">
            The Countdown Is On
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-white tracking-tight">
            Lights down. Stories up.
          </h2>
        </div>

        {/* 4 Glass Digits */}
        <div className="grid grid-cols-4 gap-3 sm:gap-6">
          
          {/* Days */}
          <div className="flex flex-col items-center">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(230,202,101,0.08)]">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#e6ca65]">
                {formatNumber(timeLeft.days)}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 mt-2 font-medium">
              Days
            </span>
          </div>

          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(230,202,101,0.08)]">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#e6ca65]">
                {formatNumber(timeLeft.hours)}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 mt-2 font-medium">
              Hours
            </span>
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(230,202,101,0.08)]">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#e6ca65]">
                {formatNumber(timeLeft.minutes)}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 mt-2 font-medium">
              Minutes
            </span>
          </div>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-xl bg-slate-900/80 border border-amber-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(230,202,101,0.08)]">
              <span className="text-2xl sm:text-3xl font-mono font-bold text-[#e6ca65]">
                {formatNumber(timeLeft.seconds)}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 mt-2 font-medium">
              Seconds
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};

