export type InkIconName = 'calendar' | 'hourglass' | 'anchor' | 'flag' | 'hat' | 'compass' | 'calendar-plus' | 'download'

/** Biểu tượng vẽ nét mực */
export default function InkIcon({ name, className = 'h-8 w-8 text-[#6b3f1d]' }: { name: InkIconName; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 32 32" className={`shrink-0 ${className}`} aria-hidden="true">
      {name === 'calendar' && (
        <g {...common}>
          <rect x="5" y="7" width="22" height="20" rx="2" />
          <path d="M5 13 H27 M11 4 V9 M21 4 V9" />
          <path d="M11 18 h2 M16 18 h2 M21 18 h2 M11 22 h2 M16 22 h2" />
        </g>
      )}
      {name === 'hourglass' && (
        <g {...common}>
          <path d="M8 4 H24 M8 28 H24" />
          <path d="M10 4 C10 12 22 12 22 16 C22 20 10 20 10 28 M22 4 C22 12 10 12 10 16 C10 20 22 20 22 28" />
          <path d="M13 25 Q16 22 19 25" />
        </g>
      )}
      {name === 'anchor' && (
        <g {...common}>
          <circle cx="16" cy="6" r="2.6" />
          <path d="M16 9 V28 M10 13 H22" />
          <path d="M5 19 C6 25 11 28 16 28 C21 28 26 25 27 19 M5 19 l-1.5 2.5 M5 19 l2.6 1.4 M27 19 l1.5 2.5 M27 19 l-2.6 1.4" />
        </g>
      )}
      {name === 'flag' && (
        <g {...common}>
          <path d="M8 29 V4" />
          <path d="M8 5 C13 2 17 8 24 5 V15 C17 18 13 12 8 15" />
          <path d="M4 29 C10 26 22 26 28 29" />
        </g>
      )}
      {name === 'hat' && (
        <g {...common}>
          <ellipse cx="16" cy="21" rx="13" ry="4" />
          <path d="M8 20 C8 11 24 11 24 20" />
          <path d="M8.5 17 C13 15.5 19 15.5 23.5 17" strokeWidth="3" stroke="#a8361c" />
        </g>
      )}
      {name === 'compass' && (
        <g {...common}>
          <circle cx="16" cy="16" r="12" />
          <path d="M16 6 V8 M16 24 V26 M6 16 H8 M24 16 H26" />
          <path d="M20.5 11.5 L17.6 17.6 L11.5 20.5 L14.4 14.4 Z" fill="currentColor" fillOpacity="0.25" />
        </g>
      )}
      {name === 'calendar-plus' && (
        <g {...common}>
          <rect x="5" y="7" width="22" height="20" rx="2" />
          <path d="M5 13 H27 M11 4 V9 M21 4 V9" />
          <path d="M16 16.5 V23.5 M12.5 20 H19.5" />
        </g>
      )}
      {name === 'download' && (
        <g {...common}>
          <path d="M16 5 V20 M10 14.5 L16 20.5 L22 14.5" />
          <path d="M6 22 V26 H26 V22" />
        </g>
      )}
    </svg>
  )
}
