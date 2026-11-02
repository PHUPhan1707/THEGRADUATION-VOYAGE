import { AnimatePresence, motion, type Variants } from 'motion/react'
import { useCountdown } from '../../hooks/useCountdown'
import { useEventConfig } from '../../hooks/useEventConfig'
import { ASSETS } from '../../lib/assets'
import { buildGoogleCalendarUrl, downloadIcs, type CalendarEvent } from '../../lib/calendar'
import { SITE_CONFIG } from '../../lib/config'
import { formatCeremonyTime, formatDateSlash, weekdayVi } from '../../lib/format'
import FallbackImage from '../ui/FallbackImage'
import InkIcon, { type InkIconName } from '../ui/InkIcon'

/** Đường hải trình trên ảnh hải đồ (toạ độ theo ảnh 1024×576) */
const ROUTE =
  'M 828 138 C 760 165, 680 192, 600 196 S 470 200, 400 165 S 260 128, 160 158 S 48 232, 70 300 ' +
  'S 140 410, 205 452 S 340 478, 420 425 S 520 362, 600 360 S 682 352, 700 322'
const DEST = { x: 700, y: 322 }
/** Thời gian vẽ hết đường (giây); dấu X và ghim xuất hiện ngay sau đó */
const ROUTE_DRAW = 3.6
const ROUTE_START = 0.5

const list: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function TreasureMap() {
  const eventConfig = useEventConfig()
  const countdown = useCountdown(eventConfig.graduationDate, eventConfig.ceremonyTime)

  const formattedDate = `${weekdayVi(eventConfig.graduationDate)}, ${formatDateSlash(eventConfig.graduationDate)}`
  const venue = eventConfig.venue
  const university = eventConfig.university
  const mapsLink = eventConfig.mapsLink || SITE_CONFIG.mapsLink

  const calendarEvent: CalendarEvent = {
    title: `Lễ tốt nghiệp của ${eventConfig.graduateName}`,
    date: eventConfig.graduationDate,
    time: eventConfig.ceremonyTime,
    location: `${venue}, ${university}`,
    description: `${SITE_CONFIG.projectName} – ${SITE_CONFIG.tagline}`,
    durationMinutes: 180,
  }

  const rows: { icon: InkIconName; label: string; value: string }[] = [
    { icon: 'calendar', label: 'Ngày ra khơi', value: formattedDate },
    { icon: 'hourglass', label: 'Giờ nhổ neo', value: formatCeremonyTime(eventConfig.ceremonyTime) },
    { icon: 'anchor', label: 'Bến cảng', value: venue },
    { icon: 'flag', label: 'Hòn đảo', value: university },
  ]

  return (
    <motion.div className="w-full space-y-5 text-[#3b2412]" variants={list} initial="hidden" animate="shown">
      {/* Hải đồ: chạm để mở chỉ đường */}
      <motion.a
        variants={item}
        href={mapsLink}
        target="_blank"
        rel="noreferrer"
        aria-label={`Mở chỉ đường tới ${venue} trên Google Maps`}
        className="group relative block aspect-[16/9] overflow-hidden rounded-lg border-2 border-[#8a5a2b]/45 shadow-[0_10px_24px_rgba(59,36,18,0.35)]"
      >
        <FallbackImage
          sources={[ASSETS.treasureMap, ...ASSETS.venueMap]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
          empty={<div className="absolute inset-0 bg-[#e9d4a6]" />}
        />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(59,36,18,0.45)]" />

        <svg viewBox="0 0 1024 576" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <mask id="venue-route-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="576">
              <motion.path
                d={ROUTE}
                fill="none"
                stroke="#fff"
                strokeWidth="20"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: ROUTE_DRAW, delay: ROUTE_START, ease: [0.4, 0, 0.35, 1] }}
              />
            </mask>
          </defs>
          <path d={ROUTE} fill="none" stroke="#8c2414" strokeWidth="10" strokeLinecap="round" strokeDasharray="1 22" mask="url(#venue-route-mask)" />
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14, delay: ROUTE_START + ROUTE_DRAW - 0.1 }}
            style={{ transformOrigin: `${DEST.x}px ${DEST.y}px` }}
          >
            <path
              d={`M ${DEST.x - 18} ${DEST.y - 18} L ${DEST.x + 18} ${DEST.y + 18} M ${DEST.x + 18} ${DEST.y - 18} L ${DEST.x - 18} ${DEST.y + 18}`}
              stroke="#a8261a"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </motion.g>
        </svg>

        {/* Ghim sáp + nhãn địa điểm */}
        <motion.div
          className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
          style={{ left: `${(DEST.x / 1024) * 100}%`, top: `${((DEST.y - 22) / 576) * 100}%` }}
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16, delay: ROUTE_START + ROUTE_DRAW + 0.1 }}
        >
          <span className="map-label whitespace-nowrap rounded-sm px-2 py-0.5 font-letter text-[11px] font-bold text-[#3b2412] shadow-md sm:text-xs">
            {venue}
          </span>
          <span className="pin-bob mt-1">
            <span className="wax-seal relative flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-[#ffd9a0] sm:h-8 sm:w-8">
              <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-[#ffd9a0]/60" />
              <span className="h-2 w-2 rounded-full bg-[#ffe9c2]" />
            </span>
          </span>
        </motion.div>

        <span className="absolute bottom-2 left-2 rounded-full bg-[#1d2c3f]/80 px-2.5 py-1 font-letter text-[10px] font-semibold text-[#f4dfb2] backdrop-blur-sm sm:text-[11px]">
          Chạm vào hải đồ để mở chỉ đường
        </span>
      </motion.a>

      {/* Thông tin hải trình */}
      <motion.dl
        variants={item}
        className="grid grid-cols-1 rounded-lg border border-[#8a5a2b]/35 bg-cover px-4 py-1 shadow-[0_6px_16px_rgba(59,36,18,0.18)] sm:grid-cols-2 sm:gap-x-6"
        style={{ backgroundImage: `url(${ASSETS.letterPaper})` }}
      >
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3.5 border-b border-dashed border-[#8a5a2b]/35 py-3 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
            <InkIcon name={row.icon} className="h-7 w-7 text-[#6b3f1d]" />
            <div className="min-w-0">
              <dt className="font-letter text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a5a2b]">{row.label}</dt>
              <dd className="font-letter text-[15px] font-semibold leading-snug text-[#2b1a0d]">{row.value}</dd>
            </div>
          </div>
        ))}
      </motion.dl>

      {/* Hành động */}
      <motion.div variants={item} className="space-y-2.5">
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          className="btn-sheen group flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#d9a441]/70 px-6 py-3.5 font-heading text-[15px] font-bold tracking-wide text-[#f6d48a] shadow-[0_8px_18px_rgba(24,58,89,0.4)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #183A59 0%, #2A5A8C 100%)' }}
        >
          <span className="icon-wiggle">
            <InkIcon name="compass" className="h-6 w-6 text-[#f6d48a]" />
          </span>
          Chỉ đường bằng Google Maps
        </a>
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={buildGoogleCalendarUrl(calendarEvent)}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-center gap-2 rounded-lg border-2 border-[#8a5a2b]/45 bg-[#fbf1dc] px-3 py-3 font-heading text-sm font-bold text-[#3b2412] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff8e8] hover:shadow-md active:translate-y-0 active:scale-[0.98]"
          >
            <span className="icon-wiggle">
              <InkIcon name="calendar-plus" className="h-5 w-5 text-[#8c2414]" />
            </span>
            Google Lịch
          </a>
          <button
            type="button"
            onClick={() => downloadIcs(calendarEvent)}
            className="group flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-[#8a5a2b]/45 bg-[#fbf1dc] px-3 py-3 font-heading text-sm font-bold text-[#3b2412] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff8e8] hover:shadow-md active:translate-y-0 active:scale-[0.98]"
          >
            <span className="icon-wiggle">
              <InkIcon name="download" className="h-5 w-5 text-[#8c2414]" />
            </span>
            Lưu vào lịch máy
          </button>
        </div>
      </motion.div>

      {/* Đếm ngược */}
      <motion.div variants={item} className="pt-1">
        <div className="mb-3 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#8a5a2b]/60" />
          <span className="font-letter text-[11px] font-bold uppercase tracking-[0.3em] text-[#8a5a2b]">Còn lại đến ngày ra khơi</span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#8a5a2b]/60" />
        </div>

        {countdown.isExpired ? (
          <p className="text-center font-handwriting text-2xl font-bold text-[#8c2414]">Ngày ra khơi đã đến! Chúc mừng tân cử nhân!</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label={`Còn ${countdown.days} ngày ${countdown.hours} giờ ${countdown.minutes} phút`}>
            <CountTile value={countdown.days} label="Ngày" />
            <CountTile value={countdown.hours} label="Giờ" />
            <CountTile value={countdown.minutes} label="Phút" />
            <CountTile value={countdown.seconds} label="Giây" />
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function CountTile({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, '0')
  return (
    <div className="flex flex-col items-center" aria-hidden="true">
      <div className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-lg border border-[#d9a441]/50 bg-gradient-to-b from-[#1f4670] to-[#132b47] shadow-[0_6px_14px_rgba(19,43,71,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] sm:h-16">
        <span className="absolute inset-x-0 top-1/2 h-px bg-black/25" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            className="font-display text-[1.7rem] leading-none tracking-wide text-[#f6d48a] sm:text-3xl"
            initial={{ y: '-90%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '90%', opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1.5 font-letter text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a5a2b]">{label}</span>
    </div>
  )
}
