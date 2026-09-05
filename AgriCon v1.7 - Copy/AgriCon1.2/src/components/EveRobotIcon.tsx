import React from 'react';

interface EveRobotIconProps {
  className?: string;
  size?: number | string;
}

export const EveRobotIcon: React.FC<EveRobotIconProps> = ({
  className = 'w-full h-full object-contain',
  size,
}) => {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        objectFit: 'contain',
        ...(size ? { width: size, height: size } : {}),
      }}
    >
      <defs>
        {/* White Ceramic / Smooth Gloss Body Gradient */}
        <radialGradient
          id="robotWhiteBody"
          cx="42%"
          cy="38%"
          r="58%"
          fx="35%"
          fy="30%"
        >
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#f3f8fd" />
          <stop offset="80%" stopColor="#dbe7f2" />
          <stop offset="100%" stopColor="#b6cadb" />
        </radialGradient>

        {/* Ear & Wing Gloss Gradient */}
        <linearGradient id="earGloss" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#e4edf5" />
          <stop offset="100%" stopColor="#c3d5e5" />
        </linearGradient>

        {/* Visor Screen Dark Navy / Blue Gradient */}
        <radialGradient
          id="screenVisor"
          cx="45%"
          cy="40%"
          r="60%"
          fx="40%"
          fy="35%"
        >
          <stop offset="0%" stopColor="#1e3a6a" />
          <stop offset="55%" stopColor="#102347" />
          <stop offset="100%" stopColor="#071024" />
        </radialGradient>

        {/* Glowing Cyan Light / Eyes / Seams Filter */}
        <filter id="cyanNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Glowing Cyan Color Gradient */}
        <linearGradient id="cyanNeon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Hologram Pedestal Base Gradient */}
        <linearGradient id="pedestalBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="60%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* ========================================================================= */}
      {/* 1. FLOATING GLOWING BLUE PEDESTAL PLATFORM (Underneath Robot) */}
      {/* ========================================================================= */}
      {/* Hologram Glow Floor Area */}
      <ellipse
        cx="60"
        cy="108"
        rx="36"
        ry="8"
        fill="#38bdf8"
        fillOpacity="0.25"
        filter="url(#softGlow)"
      />
      {/* Pedestal Outer Rim */}
      <ellipse
        cx="60"
        cy="107"
        rx="30"
        ry="6.5"
        fill="url(#pedestalBase)"
        stroke="#93c5fd"
        strokeWidth="1"
      />
      {/* Pedestal Inner Glowing Cyan Ring */}
      <ellipse
        cx="60"
        cy="107"
        rx="22"
        ry="4.5"
        fill="none"
        stroke="#a5f3fc"
        strokeWidth="1.5"
        filter="url(#cyanNeonGlow)"
      />

      {/* ========================================================================= */}
      {/* 2. TOP ANTENNA EARS (Two white stalks with glowing cyan light slots) */}
      {/* ========================================================================= */}
      {/* Left Antenna Ear */}
      <g transform="rotate(-15 42 28)">
        <path
          d="M40 26 C38 18, 41 11, 44 10 C47 9, 49 14, 47 24 Z"
          fill="url(#earGloss)"
          stroke="#b8cee0"
          strokeWidth="0.8"
        />
        {/* Left Ear Glowing Cyan Light Slot */}
        <path
          d="M43 14 C42.5 13, 44 12, 45 13 C45.5 16, 44.5 19, 44 20"
          stroke="#38bdf8"
          strokeWidth="1.4"
          strokeLinecap="round"
          filter="url(#cyanNeonGlow)"
        />
      </g>

      {/* Right Antenna Ear */}
      <g transform="rotate(22 80 26)">
        <path
          d="M78 26 C81 18, 86 11, 89 13 C92 15, 89 20, 84 27 Z"
          fill="url(#earGloss)"
          stroke="#b8cee0"
          strokeWidth="0.8"
        />
        {/* Right Ear Glowing Cyan Light Slot */}
        <path
          d="M86 16 C87 15, 88 17, 87 19 C86 21, 84 23, 83 24"
          stroke="#38bdf8"
          strokeWidth="1.4"
          strokeLinecap="round"
          filter="url(#cyanNeonGlow)"
        />
      </g>

      {/* ========================================================================= */}
      {/* 3. SIDE ARMS / WINGS (White pod wings with cyan accent stripes) */}
      {/* ========================================================================= */}
      {/* Left Wing */}
      <path
        d="M29 60 C26 65, 27 75, 33 82 C34 78, 35 68, 33 60 Z"
        fill="url(#earGloss)"
        stroke="#adc5dc"
        strokeWidth="0.8"
      />
      <path
        d="M29 64 C29 70, 31 75, 33 77"
        stroke="#38bdf8"
        strokeWidth="1.2"
        strokeLinecap="round"
        filter="url(#cyanNeonGlow)"
      />

      {/* Right Wing */}
      <path
        d="M89 57 C94 62, 95 72, 90 81 C88 77, 85 68, 87 58 Z"
        fill="url(#earGloss)"
        stroke="#adc5dc"
        strokeWidth="0.8"
      />
      <path
        d="M91 62 C93 67, 92 73, 89 77"
        stroke="#38bdf8"
        strokeWidth="1.2"
        strokeLinecap="round"
        filter="url(#cyanNeonGlow)"
      />

      {/* ========================================================================= */}
      {/* 4. MAIN SPHERICAL ROBOT BODY */}
      {/* ========================================================================= */}
      <circle
        cx="60"
        cy="58"
        r="34"
        fill="url(#robotWhiteBody)"
        stroke="#b8d0e5"
        strokeWidth="1"
      />

      {/* Subtle Honeycomb Pattern on Upper-Right Head */}
      <g stroke="#9ec1de" strokeWidth="0.6" strokeOpacity="0.4" fill="none">
        <path d="M78 40 L82 38 L86 40 L86 44 L82 46 L78 44 Z" />
        <path d="M84 46 L88 44 L92 46 L92 50 L88 52 L84 50 Z" />
        <path d="M78 49 L82 47 L86 49 L86 53 L82 55 L78 53 Z" />
      </g>

      {/* Glowing Cyan Seam Line around head/visor */}
      <path
        d="M34 62 C34 76, 44 86, 60 86 C76 86, 88 76, 88 62"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        filter="url(#cyanNeonGlow)"
      />

      {/* Lower Belly U-Accent Seam */}
      <path
        d="M50 78 C50 87, 70 87, 70 78"
        stroke="#38bdf8"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        filter="url(#cyanNeonGlow)"
      />

      {/* Top Gloss Highlight on Ceramic Shell */}
      <ellipse
        cx="52"
        cy="33"
        rx="16"
        ry="7"
        fill="#ffffff"
        fillOpacity="0.75"
        transform="rotate(-15 52 33)"
      />

      {/* ========================================================================= */}
      {/* 5. VISOR SCREEN (Dark Blue Oval Screen) */}
      {/* ========================================================================= */}
      <ellipse
        cx="54"
        cy="55"
        rx="22"
        ry="19"
        fill="url(#screenVisor)"
        stroke="#172b50"
        strokeWidth="1.2"
      />

      {/* Visor Glass Glare Reflection */}
      <path
        d="M40 43 C46 39, 58 39, 65 42"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.35"
      />

      {/* ========================================================================= */}
      {/* 6. GLOWING CYAN EYES & SMILE (Screen.png exact smiling face) */}
      {/* ========================================================================= */}
      {/* Left Smiling Eye Arc (^ shape) */}
      <path
        d="M42 53 C44 48, 48 48, 50 53"
        stroke="url(#cyanNeon)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        filter="url(#cyanNeonGlow)"
      />

      {/* Right Smiling Eye Arc (^ shape) */}
      <path
        d="M58 53 C60 48, 64 48, 66 53"
        stroke="url(#cyanNeon)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
        filter="url(#cyanNeonGlow)"
      />

      {/* Glowing Happy Smile Mouth (◡ shape) */}
      <path
        d="M51 60 C53 64, 56 64, 58 60"
        stroke="url(#cyanNeon)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        filter="url(#cyanNeonGlow)"
      />

      {/* Sparkle Particles (Matching background ambiance) */}
      <circle cx="24" cy="36" r="1" fill="#bae6fd" opacity="0.8" />
      <circle cx="98" cy="42" r="1.2" fill="#bae6fd" opacity="0.9" />
      <circle cx="28" cy="88" r="0.8" fill="#bae6fd" opacity="0.6" />
    </svg>
  );
};

