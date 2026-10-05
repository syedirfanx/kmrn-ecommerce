import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark'; // 'light' for light backgrounds (normal dark logo), 'dark' for dark backgrounds (inverted/reverse colour)
  size?: 'sm' | 'md' | 'lg';
  customLogoUrl?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
  customLogoUrl
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  // Use custom logo or default to user's uploaded aniq-logo.png
  const candidateSrc = customLogoUrl || '/images/aniq-logo.png';

  const sizeClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-12',
    lg: 'h-14 sm:h-16'
  };

  const textClasses = {
    light: 'text-neutral-900 group-hover:text-neutral-700',
    dark: 'text-white group-hover:text-neutral-200'
  };

  const fontSizeClasses = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl'
  };

  // If image fails or not available, render clean typography
  if (hasImageError || !candidateSrc) {
    return (
      <span
        className={`font-heading font-extrabold ${fontSizeClasses[size]} tracking-tight ${textClasses[variant]} transition-colors select-none ${className}`}
      >
        ANIQ
      </span>
    );
  }

  // Reverse colour for dark backgrounds: brightness-0 invert makes dark pixels pure white
  // For light backgrounds: mix-blend-multiply removes any background box
  const imageFilterClass = variant === 'dark' ? 'brightness-0 invert drop-shadow-md' : 'mix-blend-multiply';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src={candidateSrc}
        alt="ANIQ"
        onError={() => setHasImageError(true)}
        className={`${sizeClasses[size]} w-auto max-w-[200px] sm:max-w-[280px] object-contain transition-all duration-200 ${imageFilterClass} select-none`}
      />
    </div>
  );
};
