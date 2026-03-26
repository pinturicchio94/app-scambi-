export default function YellowPecoraMascot({ className = "w-12 h-12" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Yellow Pecora Mascot"
    >
      {/* Body - fluffy wool */}
      <ellipse cx="60" cy="68" rx="38" ry="32" fill="#FDE047" />
      {/* Wool puffs */}
      <circle cx="32" cy="55" r="14" fill="#FDE047" />
      <circle cx="48" cy="42" r="13" fill="#FDE047" />
      <circle cx="72" cy="42" r="13" fill="#FDE047" />
      <circle cx="88" cy="55" r="14" fill="#FDE047" />
      <circle cx="38" cy="78" r="12" fill="#FDE047" />
      <circle cx="82" cy="78" r="12" fill="#FDE047" />
      <circle cx="60" cy="38" r="12" fill="#FDE047" />
      {/* Head */}
      <ellipse cx="60" cy="52" rx="22" ry="20" fill="#FEFCE8" />
      {/* Ears */}
      <ellipse cx="36" cy="42" rx="8" ry="5" fill="#FEFCE8" transform="rotate(-20 36 42)" />
      <ellipse cx="84" cy="42" rx="8" ry="5" fill="#FEFCE8" transform="rotate(20 84 42)" />
      {/* Inner ears */}
      <ellipse cx="36" cy="42" rx="5" ry="3" fill="#FCD34D" transform="rotate(-20 36 42)" />
      <ellipse cx="84" cy="42" rx="5" ry="3" fill="#FCD34D" transform="rotate(20 84 42)" />
      {/* Eyes */}
      <circle cx="52" cy="50" r="4" fill="#1A1A1A" />
      <circle cx="68" cy="50" r="4" fill="#1A1A1A" />
      {/* Eye shine */}
      <circle cx="53.5" cy="48.5" r="1.5" fill="white" />
      <circle cx="69.5" cy="48.5" r="1.5" fill="white" />
      {/* Nose */}
      <ellipse cx="60" cy="56" rx="3" ry="2" fill="#D97706" />
      {/* Smile */}
      <path d="M54 59 Q60 64 66 59" stroke="#1A1A1A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Blush */}
      <ellipse cx="46" cy="56" rx="4" ry="2.5" fill="#FCA5A5" opacity="0.5" />
      <ellipse cx="74" cy="56" rx="4" ry="2.5" fill="#FCA5A5" opacity="0.5" />
      {/* Legs */}
      <rect x="42" y="90" width="8" height="14" rx="4" fill="#92400E" />
      <rect x="70" y="90" width="8" height="14" rx="4" fill="#92400E" />
      {/* Hooves */}
      <rect x="41" y="100" width="10" height="5" rx="2.5" fill="#78350F" />
      <rect x="69" y="100" width="10" height="5" rx="2.5" fill="#78350F" />
    </svg>
  );
}
