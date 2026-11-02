export type OverlayId = 'map' | 'closing'

export interface NavItem {
  id: OverlayId
  icon: string
  label: string
  shortLabel: string
  sublabel: string
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'map', icon: '🗺️', label: 'Bản đồ địa điểm', shortLabel: 'Bản đồ', sublabel: 'Xem chi tiết' },
  { id: 'closing', icon: '⚓', label: 'Lời kết', shortLabel: 'Lời kết', sublabel: 'Hẹn gặp bạn!' },
]

/** Thanh nút nổi ở đáy màn hình (hiện sau khi cuộn khỏi màn hình đầu). */
export default function NavigationIcons({
  onNavigate,
  visible,
}: {
  onNavigate: (id: OverlayId) => void
  visible: boolean
}) {
  return (
    <nav
      aria-label="Điều hướng thiệp"
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="plank flex w-full max-w-xs gap-1.5 rounded-2xl border-2 border-[#d9a441]/70 p-1.5 sm:max-w-sm">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            tabIndex={visible ? 0 : -1}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            className={`group flex min-h-[54px] flex-1 [@media(max-height:500px)]:min-h-[38px] [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:gap-1.5 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
              item.id === 'map'
                ? 'btn-sheen bg-gradient-to-b from-[#e8604f] to-[#b3261a] text-white shadow-md'
                : 'bg-[#f6e6c0] text-navy hover:bg-[#fff3d2]'
            }`}
          >
            <span className="icon-wiggle text-xl leading-none [@media(max-height:500px)]:text-base" aria-hidden="true">
              {item.icon}
            </span>
            <span className="font-heading text-[11px] font-bold leading-tight">{item.shortLabel}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
