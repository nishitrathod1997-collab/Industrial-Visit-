import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface CompanyImageProps {
  src?: string;
  alt: string;
  companyName: string;
  logoSrc?: string;
  className?: string;
  aspectRatio?: 'video' | 'wide' | 'square' | 'banner';
}

export const CompanyImage: React.FC<CompanyImageProps> = ({
  src,
  alt,
  companyName,
  logoSrc,
  className = '',
  aspectRatio = 'video',
}) => {
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Default fallback image by aspect ratio
  const fallbackGrads = [
    'from-slate-800 to-slate-900',
    'from-[#0B2545] to-[#133E87]',
    'from-blue-900 to-indigo-950',
    'from-slate-900 to-blue-950',
  ];

  // Derive initial letters from company name
  const initials = companyName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-[16/9]'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : 'h-40 w-full';

  return (
    <div className={`relative overflow-hidden bg-slate-900 rounded-t-xl ${aspectClass} ${className}`}>
      {!imageError && src ? (
        <img
          src={src}
          alt={alt || companyName}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0B2545] to-[#133E87] p-4 text-center">
          <div className="flex flex-col items-center gap-1.5 opacity-90">
            <Building2 className="h-8 w-8 text-amber-400/80" />
            <span className="text-xs font-bold text-white tracking-wide">{companyName}</span>
          </div>
        </div>
      )}

      {/* Subtle vignette/gradient overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent pointer-events-none" />

      {/* Company Brand Badge (Bottom-Left) */}
      <div className="absolute bottom-2.5 left-3 flex items-center gap-2 pointer-events-none">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-[#0B2545] font-black text-xs shadow-md backdrop-blur-xs border border-white/20">
          {!logoError && logoSrc ? (
            <img
              src={logoSrc}
              alt={companyName}
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
              className="h-full w-full object-cover rounded-md"
            />
          ) : (
            <span>{initials || 'CO'}</span>
          )}
        </div>
        <span className="text-xs font-bold text-white drop-shadow-md truncate max-w-[180px]">
          {companyName}
        </span>
      </div>
    </div>
  );
};
