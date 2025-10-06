import React from "react";
import "./Logo.css";

const Logo: React.FC = () => (
  <div className="logo-container">
    <svg
      width="220"
      height="72"
      viewBox="0 0 300 80"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-img"
      role="img"
      aria-label="em logo"
      style={{ verticalAlign: "middle" }}
    >
      <defs>
        <linearGradient id="brandOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC066" />
          <stop offset="35%" stopColor="#FFA733" />
          <stop offset="65%" stopColor="#FF7A1A" />
          <stop offset="100%" stopColor="#C44400" />
        </linearGradient>
        <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D7DCE1" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#D7DCE1" stopOpacity="0" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.28" />
        </filter>
        <linearGradient id="chevHighlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="eEdgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C24C00" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#C24C00" stopOpacity="0" />
          <stop offset="100%" stopColor="#C24C00" stopOpacity="0" />
        </linearGradient>
        <clipPath id="clipE">
          <text x="56" y="65" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="70">E</text>
        </clipPath>
        <clipPath id="clipM">
          <text x="90" y="74" fontFamily="Poppins, sans-serif" fontStyle="italic" fontWeight="700" fontSize="34">m</text>
        </clipPath>
      </defs>

      <g opacity="0.32" stroke="#A0A8B3" strokeWidth="1">
        <line x1="-30" y1="90" x2="120" y2="-40" />
        <line x1="-10" y1="90" x2="140" y2="-40" />
        <line x1="10" y1="90" x2="160" y2="-40" />
      </g>
      <path d="M62 12 A 66 66 0 0 1 118 68" stroke="url(#orbitGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />

      <path d="M45 10 L10 40 L45 70" stroke="url(#brandOrange)" strokeWidth="10.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)" />
      <path d="M55 10 L20 40 L55 70" stroke="#6b7280" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.38" transform="translate(19,0)" />
      <path d="M45 10 L10 40 L45 70" stroke="url(#brandOrange)" strokeWidth="10.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)" transform="translate(19,0)" />
      <path d="M45 10 L10 40 L45 70" stroke="url(#chevHighlight)" strokeWidth="3" fill="none" opacity="0.16" strokeLinecap="round" strokeLinejoin="round" transform="translate(19,0)" />

      <g clipPath="url(#clipE)">
        <rect x="57.5" y="1.5" width="100" height="80" fill="#000" opacity="0.22" />
        <rect x="50" y="0" width="110" height="80" fill="url(#brandOrange)" />
        <rect x="52" y="0" width="12" height="80" fill="url(#eEdgeGrad)" />
      </g>
      <text
        x="56"
        y="65"
        fontFamily="Poppins, sans-serif"
        fontWeight="900"
        fontSize="70"
        fill="none"
        stroke="#6B7280"
        strokeWidth="0.9"
        paintOrder="stroke"
        opacity="0.7"
      >
        E
      </text>

      <g clipPath="url(#clipM)">
        <rect x="86" y="46" width="56" height="32" fill="url(#brandOrange)" />
      </g>
      <text x="90" y="74" fontFamily="Poppins, sans-serif" fontStyle="italic" fontWeight="700" fontSize="34" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" paintOrder="stroke">m</text>
    </svg>
  </div>
);

export default Logo;
