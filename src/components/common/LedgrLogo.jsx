import React from 'react';

export default function LedgrLogo({ size = 36, className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      {/* Dark Forest Pine Squircle Background */}
      <rect width="200" height="200" rx="46" fill="#243834" />
      
      {/* Upward Line with Angle */}
      <path 
        d="M 52 125 L 87 97 L 152 32" 
        stroke="#8FD1BE" 
        strokeWidth="7.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Arrowhead */}
      <polygon 
        points="150,30 152,58 174,34" 
        fill="#8FD1BE" 
      />
      
      {/* 3 Rounded Bars of Increasing Heights */}
      {/* Bar 1 */}
      <rect x="52" y="130" width="23" height="40" rx="6" fill="#8FD1BE" />
      {/* Bar 2 */}
      <rect x="88" y="104" width="23" height="66" rx="6" fill="#8FD1BE" />
      {/* Bar 3 */}
      <rect x="124" y="67" width="23" height="103" rx="6" fill="#8FD1BE" />
    </svg>
  );
}
