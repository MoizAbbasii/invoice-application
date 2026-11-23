import React from 'react';

interface BimAutoLogoProps {
  customLogoDataUrl?: string;
}

export const BimAutoLogo: React.FC<BimAutoLogoProps> = ({ customLogoDataUrl }) => {
  if (customLogoDataUrl) {
    return (
      <div className="w-[106px] h-[94px] flex items-center justify-center bg-white border border-slate-200 overflow-hidden shrink-0">
        <img
          src={customLogoDataUrl}
          alt="Company Logo"
          className="max-w-full max-h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className="w-[106px] h-[94px] bg-[#f7f6f4] border border-[#e6e3de] flex flex-col items-center justify-between py-2 px-1.5 shrink-0 select-none"
      aria-label="BIM auto logo"
    >
      {/* Stylized crimson mechanical gear / transmission housing emblem */}
      <svg
        viewBox="0 0 120 74"
        className="w-[82px] h-[52px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bimCrimson" x1="0" y1="0" x2="120" y2="74" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a62e29" />
            <stop offset="100%" stopColor="#8c231f" />
          </linearGradient>
        </defs>
        {/* Outer housing silhouette matching reference PDF */}
        <path
          d="M37 8 L83 8 L88 18 L99 22 L95 31 L101 38 L94 45 L99 54 L88 60 L75 68 L64 68 L60 56 L56 68 L45 68 L32 60 L21 54 L26 45 L19 38 L25 31 L21 22 L32 18 Z"
          fill="url(#bimCrimson)"
        />
        {/* Inner bore ring */}
        <circle cx="60" cy="36" r="17" fill="#f7f6f4" />
        <circle cx="60" cy="36" r="11" fill="url(#bimCrimson)" />
        <circle cx="60" cy="36" r="6" fill="#f7f6f4" />
        {/* Lower center stem notch */}
        <path d="M55 46 L65 46 L60 66 Z" fill="#f7f6f4" />
        <path d="M58 55 L62 55 L60 72 Z" fill="#6b7280" />
      </svg>

      {/* BIM | auto wordmark */}
      <div className="flex items-center justify-center gap-1.5 leading-none text-[#1f2937]">
        <span className="text-[19px] font-bold tracking-tight font-serif">BIM</span>
        <span className="w-[2px] h-[20px] bg-[#6b7280] inline-block" aria-hidden="true" />
        <span className="text-[17px] font-semibold tracking-tight font-sans">auto</span>
      </div>
    </div>
  );
};
