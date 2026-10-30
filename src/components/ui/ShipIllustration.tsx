/**
 * Con tàu hải tặc vẽ bằng SVG – dùng làm "nhân vật chính" của nền khi chưa có ảnh nền thật.
 * Khi bạn thêm bg-landscape.jpg / bg-portrait.jpg thì component này tự biến mất.
 */
export default function ShipIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="-100 0 800 520"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      role="img"
      aria-label="Con tàu hải tặc"
    >
      <defs>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A8703A" />
          <stop offset="1" stopColor="#6e431b" />
        </linearGradient>
        <linearGradient id="sail" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EADFC4" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFF3C4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFF3C4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Quầng sáng sau tàu */}
      <circle cx="300" cy="230" r="240" fill="url(#glow)" />

      <g className="ship-rock">
        {/* Dây buồm */}
        <path d="M300 92 L525 322 M300 92 L82 322 M443 150 L525 322" stroke="#5a3716" strokeWidth="2" fill="none" />

        {/* Cột buồm */}
        <rect x="294" y="86" width="12" height="240" rx="4" fill="#6b4423" />
        <rect x="438" y="146" width="10" height="180" rx="4" fill="#6b4423" />
        <rect x="170" y="108" width="260" height="8" rx="4" fill="#5a3716" />
        <rect x="378" y="156" width="130" height="7" rx="3" fill="#5a3716" />

        {/* Cờ trên đỉnh cột */}
        <path d="M306 70 L372 70 Q362 88 372 106 L306 106 Z" fill="#1d1d1d" />
        <circle cx="338" cy="87" r="10" fill="#fff" />
        <circle cx="334" cy="85" r="2.4" fill="#1d1d1d" />
        <circle cx="342" cy="85" r="2.4" fill="#1d1d1d" />
        <ellipse cx="338" cy="77" rx="16" ry="3.5" fill="#F2C14E" />
        <path d="M328 77 Q338 62 348 77 Z" fill="#F5D06A" />

        {/* Buồm chính + Jolly Roger mũ rơm */}
        <path d="M178 118 Q300 98 422 118 L416 272 Q300 302 184 272 Z" fill="url(#sail)" stroke="#cdbd9a" strokeWidth="3" />
        <g>
          {/* xương chéo */}
          <path d="M252 232 L348 268 M348 232 L252 268" stroke="#1d1d1d" strokeWidth="13" strokeLinecap="round" />
          <path d="M252 232 L348 268 M348 232 L252 268" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
          {/* đầu lâu */}
          <circle cx="300" cy="198" r="38" fill="#fff" stroke="#1d1d1d" strokeWidth="5" />
          <rect x="278" y="222" width="44" height="22" rx="6" fill="#fff" stroke="#1d1d1d" strokeWidth="5" />
          <path d="M290 230 V242 M300 230 V242 M310 230 V242" stroke="#1d1d1d" strokeWidth="3" />
          <ellipse cx="286" cy="198" rx="10" ry="12" fill="#1d1d1d" />
          <ellipse cx="314" cy="198" rx="10" ry="12" fill="#1d1d1d" />
          <path d="M300 208 L294 220 H306 Z" fill="#1d1d1d" />
          {/* mũ rơm */}
          <ellipse cx="300" cy="162" rx="62" ry="12" fill="#F2C14E" stroke="#b8860b" strokeWidth="3" />
          <path d="M262 162 Q300 108 338 162 Z" fill="#F5D06A" stroke="#b8860b" strokeWidth="3" />
          <path d="M265 150 Q300 142 335 150 L337 160 Q300 152 263 160 Z" fill="#C0392B" />
        </g>

        {/* Buồm phụ + mặt trời */}
        <path d="M388 166 Q443 154 498 166 L495 262 Q443 276 392 262 Z" fill="url(#sail)" stroke="#cdbd9a" strokeWidth="3" />
        <g transform="translate(443 214)">
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={i} cx="0" cy="-26" rx="6" ry="10" fill="#F39C12" transform={`rotate(${i * 30})`} />
          ))}
          <circle r="19" fill="#F7D154" stroke="#E8932A" strokeWidth="3" />
          <circle cx="-6" cy="-3" r="2.6" fill="#1d1d1d" />
          <circle cx="6" cy="-3" r="2.6" fill="#1d1d1d" />
          <path d="M-8 5 Q0 13 8 5" stroke="#1d1d1d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>

        {/* Thân tàu */}
        <path d="M70 330 L530 330 Q522 398 462 416 L148 416 Q82 398 70 330 Z" fill="url(#hull)" stroke="#4a2c10" strokeWidth="4" />
        <path d="M62 332 H538 V318 H62 Z" fill="#B87A3E" stroke="#4a2c10" strokeWidth="3" />
        <path d="M78 358 H522" stroke="#D9A441" strokeWidth="7" />
        {[150, 210, 270, 330, 390, 450].map((x) => (
          <g key={x}>
            <circle cx={x} cy="384" r="11" fill="#27425f" stroke="#D9A441" strokeWidth="4" />
            <circle cx={x - 3} cy="381" r="3" fill="#fff" opacity="0.6" />
          </g>
        ))}

        {/* Cabin đuôi tàu */}
        <rect x="88" y="278" width="78" height="44" rx="4" fill="#C98B4B" stroke="#4a2c10" strokeWidth="3" />
        <rect x="100" y="288" width="18" height="16" rx="2" fill="#27425f" />
        <rect x="130" y="288" width="18" height="16" rx="2" fill="#27425f" />

        {/* Đầu sư tử ở mũi tàu */}
        <g transform="translate(556 342)">
          {Array.from({ length: 14 }).map((_, i) => (
            <circle key={i} cx="0" cy="-34" r="11" fill="#E8932A" transform={`rotate(${i * (360 / 14)})`} />
          ))}
          <circle r="29" fill="#F7D154" stroke="#C97A12" strokeWidth="3" />
          <circle cx="-10" cy="-5" r="3.6" fill="#1d1d1d" />
          <circle cx="10" cy="-5" r="3.6" fill="#1d1d1d" />
          <path d="M-12 8 Q0 20 12 8" stroke="#1d1d1d" strokeWidth="3" fill="none" strokeLinecap="round" />
          <ellipse cx="0" cy="3" rx="4" ry="3" fill="#C0392B" />
        </g>
      </g>

      {/* Bọt sóng quanh thân tàu (phần biển còn lại do cảnh nền vẽ) */}
      <ellipse cx="300" cy="414" rx="270" ry="12" fill="#fff" opacity="0.35" />
      <path d="M60 412 Q100 400 140 412 T220 412 T300 412 T380 412 T460 412 T540 412" stroke="#fff" strokeWidth="4" fill="none" opacity="0.75" strokeLinecap="round" />
      <path d="M90 428 Q130 418 170 428 T250 428 T330 428 T410 428 T490 428" stroke="#fff" strokeWidth="3" fill="none" opacity="0.4" strokeLinecap="round" />    </svg>
  )
}


