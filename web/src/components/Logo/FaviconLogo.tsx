import React from "react";

const FaviconLogo: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="brandOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFC066" />
        <stop offset="35%" stopColor="#FFA733" />
        <stop offset="65%" stopColor="#FF7A1A" />
        <stop offset="100%" stopColor="#C44400" />
      </linearGradient>
    </defs>
    
    {/* Simplified version - just the chevrons and E */}
    <path d="M15 20 L5 35 L15 50" stroke="url(#brandOrange)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M25 20 L15 35 L25 50" stroke="url(#brandOrange)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Simplified E */}
    <text x="35" y="45" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="35" fill="url(#brandOrange)">E</text>
  </svg>
);

export default FaviconLogo;