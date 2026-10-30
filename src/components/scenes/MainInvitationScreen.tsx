import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { smoothScrollTo, useSmoothScroll } from '../../hooks/useSmoothScroll'
import NavigationIcons, { type OverlayId } from '../ui/NavigationIcons'
import SceneBackground from '../ui/SceneBackground'
import FallbackImage from '../ui/FallbackImage'
import InkIcon from '../ui/InkIcon'
import { InkSwash, StampIn, TORN_EDGE } from '../ui/InkDecor'
import { useEventConfig } from '../../hooks/useEventConfig'
import { useCountdown } from '../../hooks/useCountdown'
import type { BackgroundMusic } from '../../hooks/useBackgroundMusic'
import { ASSETS } from '../../lib/assets'
import { SITE_CONFIG } from '../../lib/config'
import { fillTemplate, formatCeremonyTime, formatDateDots, formatDateSlash, weekdayVi } from '../../lib/format'
import type { EventConfig } from '../../types'

interface MainInvitationScreenProps {
  guestName: string
  personalMessage?: string
  music: BackgroundMusic
  onOpenOverlay: (id: OverlayId) => void
  /** Đang mở popup → tạm dừng cuộn mượt */
  overlayOpen?: boolean
  /** Màn mở đầu đã bắt đầu biến mất → chạy hiệu ứng xuất hiện của con tàu */
  revealed?: boolean
  /** Giây trì hoãn chữ ở Hero, để chữ chỉ bật lên khi hải âu đã bay khỏi màn hình */
  textLag?: number
}

/* ───────────────────────── Nút nhạc ───────────────────────── */

function MusicButtons({ music }: { music: BackgroundMusic }) {
  if (!music.available) return null
  const base =
    'flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 bg-navy/85 text-lg shadow-lg backdrop-blur transition-all'
  return (
    <div
      className="fixed right-3 z-50 flex items-center gap-2"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      <button
        type="button"
        onClick={music.toggle}
        className={`${base} ${
          music.playing
            ? 'animate-spin-slow border-treasure-gold text-treasure-gold'
            : 'border-white/50 text-white/90 hover:border-treasure-gold'
        }`}
        aria-label={music.playing ? 'Dừng nhạc' : 'Bật nhạc'}
        aria-pressed={music.playing}
      >
        <span aria-hidden="true">🎵</span>
      </button>
      <button
        type="button"
        onClick={music.toggleMute}
        className={`${base} border-white/50 text-white/90 hover:border-treasure-gold`}
        aria-label={music.muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        aria-pressed={music.muted}
      >
        <span aria-hidden="true">{music.muted ? '🔇' : '🔊'}</span>
      </button>
    </div>
  )
}

/* ───────────────────────── 1. Màn hình đầu ───────────────────────── */


const easeOut = [0.22, 1, 0.36, 1] as const

/** Chữ tiêu đề kiểu poster: từng chữ cái bật lên lần lượt, sau đó có vệt sáng vàng lướt qua */
function PosterLetters({
  text,
  revealed,
  delay,
  big = false,
  className = '',
}: {
  text: string
  revealed: boolean
  delay: number
  big?: boolean
  className?: string
}) {
  const hidden = { opacity: 0, y: big ? '55%' : '-45%', rotate: big ? 8 : -10, scale: big ? 0.6 : 0.8 }
  return (
    <span className={`block whitespace-nowrap ${className}`} aria-hidden="true">
      {Array.from(text).map((ch, i) =>
        ch === ' ' ? (
          <span key={i} className="inline-block w-[0.28em]" />
        ) : (
          <motion.span
            key={i}
            className="inline-block"
            initial={hidden}
            animate={revealed ? { opacity: 1, y: '0%', rotate: 0, scale: 1 } : hidden}
            transition={{ type: 'spring', stiffness: big ? 320 : 380, damping: big ? 13 : 18, delay: delay + i * (big ? 0.07 : 0.035) }}
          >
            <span className="title-poster title-shine inline-block" style={{ animationDelay: `${2.6 + i * 0.07}s` }}>
              {ch}
            </span>
          </motion.span>
        ),
      )}
    </span>
  )
}

function Hero({ config, guestName, revealed, textLag }: { config: EventConfig; guestName: string; revealed: boolean; textLag: number }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  // Chỉ chạy hiệu ứng xuất hiện khi màn mở đầu đã tan (trang được dựng sẵn bên dưới từ trước)
  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 26, filter: 'blur(6px)' },
    animate: revealed ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 26, filter: 'blur(6px)' },
    transition: { duration: 0.9, delay: delay + 0.5 + textLag, ease: easeOut },
  })

  return (
    <header ref={ref} className="relative min-h-dvh overflow-hidden">
      <motion.div className="absolute inset-0 will-change-transform" style={{ y: bgY }}>
        <SceneBackground entered={revealed} />
      </motion.div>

      {/* Lớp tối giúp chữ dễ đọc: điện thoại tối ở trên + dưới, máy tính tối bên trái */}
      <div
        className="pointer-events-none absolute inset-0 side:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(6,24,46,0.62) 0%, rgba(6,24,46,0.15) 30%, transparent 46%, rgba(6,24,46,0.55) 68%, #143f66 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden side:block"
        style={{
          background: 'linear-gradient(90deg, rgba(6,24,46,0.78) 0%, rgba(6,24,46,0.45) 32%, transparent 58%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28vh] bg-gradient-to-b from-transparent via-[#143f66]/75 to-[#143f66]" />

      <motion.div
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col justify-between px-5 text-center side:justify-center side:px-[5vw] side:text-left short:py-4"
        style={{ y: contentY, opacity: contentOpacity, paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        {/* Tiêu đề */}
        <div className="pt-16 side:max-w-[min(48vw,640px)] side:pt-0">
          <motion.p
            {...enter(0.1)}
            animate={
              revealed
                ? { opacity: 1, y: 0, filter: 'blur(0px)', letterSpacing: '0.5em' }
                : { opacity: 0, y: 26, filter: 'blur(6px)', letterSpacing: '1.1em' }
            }
            className="font-display text-xs text-white/95 drop-shadow-[0_2px_4px_rgba(0,30,60,0.6)] sm:text-sm"
          >
            <span className="animate-twinkle text-[#ffd98a]" aria-hidden="true">★</span> THƯ MỜI TỐT NGHIỆP{' '}
            <span className="animate-twinkle text-[#ffd98a]" style={{ animationDelay: '-1.2s' }} aria-hidden="true">★</span>
          </motion.p>
          <h1 className="mt-2 leading-[0.92]" aria-label="The Graduation Voyage">
            <PosterLetters
              text="THE GRADUATION"
              revealed={revealed}
              delay={0.75 + textLag}
              className="text-[clamp(2rem,min(9vw,7.5dvh),4.6rem)]"
            />
            <PosterLetters
              text="VOYAGE"
              revealed={revealed}
              delay={1.15 + textLag}
              big
              className="text-[clamp(3.6rem,min(19vw,15dvh),9.5rem)]"
            />
          </h1>
          <motion.p
            {...enter(0.55)}
            className="mt-3 font-heading text-base font-bold italic short:mt-1 short:text-sm text-white drop-shadow-[0_2px_6px_rgba(0,30,60,0.8)] sm:text-xl"
          >
            Một lời mời từ Tân Thế Giới
          </motion.p>
        </div>

        {/* Lời đề tặng + thông tin + gợi ý cuộn */}
        <div className="side:mt-10 side:max-w-[min(48vw,640px)] short:mt-2">
          <motion.div {...enter(0.75)}>
            <div className="flex items-center justify-center gap-3 side:justify-start" aria-hidden="true">
              <motion.span
                className="h-px w-10 origin-right bg-gradient-to-r from-transparent to-[#ffd98a] side:hidden"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: revealed ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 1.5 + textLag, ease: easeOut }}
              />
              <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.42em] text-[#ffe2a8] sm:text-xs">
                Trân trọng gửi đến
              </span>
              <motion.span
                className="h-px w-10 origin-left bg-gradient-to-l from-transparent to-[#ffd98a] side:w-16 side:bg-gradient-to-r side:from-[#ffd98a] side:to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: revealed ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 1.5 + textLag, ease: easeOut }}
              />
            </div>
            <p className="sr-only">Trân trọng gửi đến</p>
            {/* Tên khách hiện ra như được viết tay từ trái sang phải */}
            <motion.p
              className="guest-name guest-shine mt-1 text-balance font-handwriting text-[clamp(2.1rem,9vw,4.2rem)] font-bold side:text-[clamp(2.2rem,3.4vw,3.6rem)] short:text-[2rem] leading-[1.1]"
              initial={{ clipPath: 'inset(-30% 100% -30% -10%)' }}
              animate={{ clipPath: revealed ? 'inset(-30% -10% -30% -10%)' : 'inset(-30% 100% -30% -10%)' }}
              transition={{ duration: 1.5, delay: 1.6 + textLag, ease: [0.45, 0, 0.3, 1] }}
            >
              {guestName}
            </motion.p>
          </motion.div>

          <motion.div
            {...enter(0.9)}
            className="mt-3 font-heading text-[13px] font-semibold uppercase tracking-[0.22em] text-white/90 drop-shadow-[0_1px_3px_rgba(0,20,40,0.8)] sm:text-sm"
          >
            <p>
              {weekdayVi(config.graduationDate)}
              <span className="mx-2.5 text-[#ffd98a]" aria-hidden="true">✦</span>
              {formatDateDots(config.graduationDate)}
            </p>
            <p className="mt-1 text-white/80">{config.venue}</p>
            {!config.ceremonyTime && (
              <p className="mt-1 text-[11px] normal-case italic tracking-[0.08em] text-white/60">
                Giờ làm lễ {SITE_CONFIG.timeTbd.toLowerCase()}
              </p>
            )}
            {config.ceremonyTime && <p className="mt-1 text-white/80">{formatCeremonyTime(config.ceremonyTime)}</p>}
          </motion.div>

          <motion.button
            {...enter(1.1)}
            type="button"
            onClick={() => smoothScrollTo('#letter')}
            aria-label="Đọc thư mời"
            className="group mx-auto mt-6 flex cursor-pointer flex-col items-center gap-2 side:mx-0 side:flex-row side:gap-4 short:mt-3"
          >
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#ffd98a]/80 bg-white/10 text-[#ffe2a8] backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-white/20 group-active:scale-95">
              <span className="absolute inset-0 animate-ping rounded-full border border-[#ffd98a]/40" aria-hidden="true" />
              {/* Vòng la bàn xoay quanh nút */}
              <span
                className="animate-spin-slow absolute -inset-1.5 rounded-full border border-dashed border-[#ffd98a]/50"
                style={{ animationDuration: '14s' }}
                aria-hidden="true"
              />
              <span className="animate-bob text-lg" aria-hidden="true">
                ↓
              </span>
            </span>
            <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.4em] text-white/80 transition-all duration-300 group-hover:tracking-[0.5em] group-hover:text-white">
              Mở thư mời
            </span>
          </motion.button>
        </div>
      </motion.div>
    </header>
  )
}

/* ───────────────────────── 2. Thư mời (cuộn giấy) ───────────────────────── */

/** Mép giấy ố sậm như bị hơ lửa + ánh đèn chiếu từ trên xuống */
const PAPER_AGING =
  'radial-gradient(ellipse 120% 110% at 50% 38%, transparent 55%, rgba(120,62,18,0.18) 78%, rgba(78,36,8,0.42) 100%), linear-gradient(170deg, rgba(255,248,225,0.22), transparent 45%, rgba(70,35,10,0.10))'
/** Hai nếp gấp ngang của lá thư từng được gấp ba */
const PAPER_CREASES =
  'linear-gradient(180deg, transparent 32.6%, rgba(110,70,30,0.13) 33.1%, rgba(255,252,240,0.32) 33.6%, transparent 34.4%, transparent 65.6%, rgba(110,70,30,0.13) 66.1%, rgba(255,252,240,0.32) 66.6%, transparent 67.4%)'

function CompassRose({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="50" cy="50" r="46" strokeWidth="1" />
      <circle cx="50" cy="50" r="40" strokeWidth="0.6" strokeDasharray="2 3" />
      <path d="M50 6 L57 43 L94 50 L57 57 L50 94 L43 57 L6 50 L43 43 Z" strokeWidth="1.2" />
      <path d="M50 6 L57 43 L50 50 Z M94 50 L57 57 L50 50 Z M50 94 L43 57 L50 50 Z M6 50 L43 43 L50 50 Z" fill="currentColor" fillOpacity="0.85" stroke="none" />
      <path d="M50 22 L54 46 L78 50 L54 54 L50 78 L46 54 L22 50 L46 46 Z" strokeWidth="0.8" transform="rotate(45 50 50)" />
      <circle cx="50" cy="50" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

function LetterScroll({ config, guestName, personalMessage, compact = false }: { config: EventConfig; guestName: string; personalMessage?: string; compact?: boolean }) {
  const k = (normal: string, small: string) => (compact ? small : normal)
  const values = { date: formatDateSlash(config.graduationDate), university: config.university }
  const paragraphs = SITE_CONFIG.letter.paragraphs.map((p) => fillTemplate(p, values))

  return (
    <div className={k('mx-auto max-w-[700px]', 'w-full')}>
      <article
        className={`relative overflow-hidden text-[#3d2b1c] ${k('px-7 pb-14 pt-12 sm:px-16 sm:pb-16 sm:pt-14', 'px-10 pb-10 pt-9')}`}
        style={{
          clipPath: TORN_EDGE,
          backgroundColor: '#f1e2c0',
          backgroundImage: `${PAPER_CREASES}, ${PAPER_AGING}, radial-gradient(ellipse at 50% 40%, rgba(255,250,235,0.35), transparent 70%), url(${ASSETS.letterPaper})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* La bàn chìm phía sau chữ */}
        <CompassRose className="pointer-events-none absolute left-1/2 top-1/2 w-[85%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 text-[#8a5a2b] opacity-[0.06]" />

        <header className="relative text-center">
          <CompassRose className={`mx-auto text-[#8a5a2b] ${k('h-12 w-12 sm:h-14 sm:w-14', 'hidden')}`} />
          <p className={`font-letter text-[11px] font-semibold uppercase tracking-[0.42em] text-[#8a5a2b] ${k('mt-3', 'mt-2')}`}>
            Nhật ký thuyền trưởng
          </p>
          <h2 className={`mt-1 font-handwriting font-bold leading-tight text-[#3b2412] ${k('text-[2.9rem] sm:text-6xl', 'text-5xl')}`}>
            Lời mời lên tàu
          </h2>
          <InkSwash className="mx-auto mt-1 w-44" />
        </header>

        <div className={`relative font-letter ${k('mt-9 text-[16px] leading-[1.9] sm:text-[17.5px]', 'mt-5 text-[15px] leading-[1.75]')}`}>
          <p className={`font-handwriting font-bold leading-tight ${k('text-[1.9rem] sm:text-[2.2rem]', 'text-[1.8rem]')}`}>
            Gửi <span className="text-[#8c2414]">{guestName}</span> thân mến,
          </p>

          {personalMessage && (
            <p className="mt-4 border-l-2 border-[#8a5a2b]/50 pl-4 italic text-[#5a3f28]">“{personalMessage}”</p>
          )}

          <div className={`[text-wrap:pretty] ${k('mt-4 space-y-4', 'mt-3 space-y-3')}`}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="indent-6">
                {paragraph}
              </p>
            ))}
          </div>

          <p className={`text-center font-letter italic text-[#7a4a1f] ${k('mt-7 text-lg sm:text-xl', 'mt-4 text-lg')}`}>
            ~ {SITE_CONFIG.letter.closing} ~
          </p>

          {/* Chữ ký + dấu sáp */}
          <motion.div className={`flex items-center justify-end gap-3 sm:gap-5 ${k('mt-8', 'mt-3')}`}
            initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.5 }}>
            <div className="text-right">
              <p className="font-letter text-sm italic text-[#7a4a1f]">Thân ái,</p>
              <motion.p
                className={`whitespace-nowrap font-handwriting font-bold leading-none text-[#2c1a0c] ${k('text-[2.6rem] sm:text-[3.4rem]', 'text-[2.8rem]')}`}
                variants={{ hidden: { clipPath: 'inset(-30% 100% -30% -5%)' }, shown: { clipPath: 'inset(-30% -5% -30% -5%)' } }}
                transition={{ duration: 1.6, delay: 0.3, ease: [0.45, 0, 0.3, 1] }}
              >
                {config.graduateName}
              </motion.p>
              <p className="mt-2 whitespace-nowrap font-letter text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a5a2b] sm:text-[11px] sm:tracking-[0.4em]">
                Thuyền trưởng · Class of 2026
              </p>
            </div>
            <StampIn rotate={-14} delay={1.2}>
              <div
                className="wax-seal flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[1.7rem] text-[#ffd9a0] sm:h-20 sm:w-20 sm:text-4xl"
                aria-hidden="true"
              >
                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">☠</span>
              </div>
            </StampIn>
          </motion.div>
        </div>
      </article>
    </div>
  )
}

/* ───────────────────────── 3. Sổ hải trình + tờ truy nã ───────────────────────── */

function HatPlaceholder() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label="Mũ rơm">
      <rect width="200" height="200" fill="#8fd0f2" />
      <circle cx="100" cy="86" r="62" fill="#fff6c8" opacity="0.8" />
      <rect y="140" width="200" height="60" fill="#2f7fb8" />
      <path d="M0 150 Q25 140 50 150 T100 150 T150 150 T200 150" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" />
      <ellipse cx="100" cy="112" rx="78" ry="16" fill="#F2C14E" stroke="#b8860b" strokeWidth="3" />
      <path d="M52 112 Q100 28 148 112 Z" fill="#F5D06A" stroke="#b8860b" strokeWidth="3" />
      <path d="M56 98 Q100 86 144 98 L148 110 Q100 100 52 110 Z" fill="#C0392B" />
    </svg>
  )
}

/** Tờ giấy da mép rách dùng chung (giống thư mời) */
function PaperSheet({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden text-[#3d2b1c] ${className}`}
      style={{
        clipPath: TORN_EDGE,
        backgroundColor: '#f1e2c0',
        backgroundImage: `${PAPER_AGING}, radial-gradient(ellipse at 50% 40%, rgba(255,250,235,0.3), transparent 70%), url(${ASSETS.letterPaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {children}
    </div>
  )
}


function VoyageLog({ config, guestName, compact = false }: { config: EventConfig; guestName: string; compact?: boolean }) {
  const cd = useCountdown(config.graduationDate, config.ceremonyTime)
  const rows = [
    { icon: 'hat' as const, label: 'Hành khách', value: guestName, hand: true },
    { icon: 'calendar' as const, label: 'Ngày ra khơi', value: `${weekdayVi(config.graduationDate)}, ${formatDateDots(config.graduationDate)}` },
    { icon: 'hourglass' as const, label: 'Giờ nhổ neo', value: formatCeremonyTime(config.ceremonyTime) },
    { icon: 'anchor' as const, label: 'Bến cảng', value: config.venue },
    { icon: 'flag' as const, label: 'Hòn đảo', value: config.university },
  ]

  return (
    <div>
      <PaperSheet className={compact ? 'px-8 pb-8 pt-8' : 'px-7 pb-10 pt-10 sm:px-12 sm:pb-12'}>
        <CompassRose className="pointer-events-none absolute -right-16 -top-16 w-64 text-[#8a5a2b] opacity-[0.07]" />

        <header className="relative">
          <p className="font-letter text-[11px] font-semibold uppercase tracking-[0.42em] text-[#8a5a2b]">Log Pose</p>
          <h3 className="font-handwriting text-[2.6rem] font-bold leading-tight text-[#3b2412] sm:text-5xl">Sổ hải trình</h3>
          <InkSwash className="mt-1 w-40" />
        </header>

        <dl className="relative mt-5">
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              className="group flex items-center gap-4 border-b border-dashed border-[#8a5a2b]/35 py-3 last:border-b-0"
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.55, delay: 0.15 + i * 0.12, ease: 'easeOut' }}
            >
              <span className="icon-wiggle inline-flex">
                <InkIcon name={row.icon} />
              </span>
              <div className="min-w-0">
                <dt className="font-letter text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8a5a2b]">{row.label}</dt>
                <dd
                  className={
                    row.hand
                      ? 'font-handwriting text-[1.9rem] font-bold leading-tight text-[#8c2414]'
                      : 'font-letter text-[16px] font-semibold leading-snug text-[#2c1a0c] sm:text-[17px]'
                  }
                >
                  {row.value}
                </dd>
              </div>
            </motion.div>
          ))}
        </dl>

        {/* Dấu mộc đỏ đếm ngược */}
        <StampIn rotate={-14} delay={0.9} className={`absolute ${compact ? 'right-4 top-5' : 'right-5 top-7 sm:right-10 sm:top-9'}`}>
        <div
          className={`ink-stamp flex flex-col items-center justify-center rounded-full text-center ${compact ? 'h-[96px] w-[96px]' : 'h-[92px] w-[92px] sm:h-[118px] sm:w-[118px]'}`}
          role="timer"
          aria-label={cd.isExpired ? 'Đã ra khơi' : `Còn ${cd.days} ngày`}
        >
          {cd.isExpired ? (
            <span className="font-heading text-lg font-black leading-tight">ĐÃ<br />RA KHƠI</span>
          ) : (
            <>
              <span className="font-letter text-[9px] font-bold uppercase tracking-[0.25em]">Còn</span>
              <span className={`font-heading font-black leading-none ${compact ? 'text-[2.4rem]' : 'text-[2.2rem] sm:text-5xl'}`}>{cd.days}</span>
              <span className="font-letter text-[8px] font-bold uppercase tracking-[0.15em] sm:text-[9px] sm:tracking-[0.25em]">ngày ra khơi</span>
            </>
          )}
        </div>
        </StampIn>
      </PaperSheet>
    </div>
  )
}

function WantedPoster({ config }: { config: EventConfig }) {
  const sources = [config.portraitUrl, ASSETS.graduatePortrait, ASSETS.wantedPhoto].filter(Boolean) as string[]
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <PaperSheet className="px-5 pb-6 pt-7 text-center">
        <p className="font-heading text-[3.6rem] font-black leading-none tracking-[0.04em] text-[#2c1a0c]">WANTED</p>

        <div className="relative mx-auto mt-3 aspect-[4/3.3] w-full overflow-hidden border-[3px] border-[#2c1a0c] bg-[#8fd0f2]">
          <FallbackImage
            sources={sources}
            alt={`Chân dung ${config.graduateName}`}
            className="h-full w-full object-cover sepia-[0.25]"
            empty={<HatPlaceholder />}
          />
          <StampIn rotate={-14} delay={0.8} className="absolute bottom-2 right-1">
            <div
              className="rounded-sm border-[3px] border-double border-[#a8261a] bg-[#f6e8c8]/90 px-2 py-0.5 font-heading text-base font-black tracking-[0.15em] text-[#a8261a] shadow-md"
              aria-hidden="true"
            >
              GRADUATED
            </div>
          </StampIn>
        </div>

        <p className="mt-3 font-heading text-lg font-black tracking-[0.12em] text-[#2c1a0c]">DEAD OR ALIVE</p>
        <p className="font-heading text-[1.75rem] font-black uppercase leading-tight tracking-wide text-[#2c1a0c]">
          {config.graduateName}
        </p>
        <p className="mt-1 font-heading text-[1.55rem] font-black tracking-wide text-[#2c1a0c]">
          <span className="mr-1" aria-hidden="true">฿</span>1.000.000.000<span aria-hidden="true">—</span>
        </p>
        <p className="mt-2 border-t border-[#2c1a0c]/40 pt-2 font-letter text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6b3f1d]">
          Tiền thưởng · 1 tấm bằng đại học
        </p>
      </PaperSheet>
    </div>
  )
}

/* ───────────────────────── 2. Màn hải trình: thư mời + sổ hải trình + tờ truy nã ───────────────────────── */

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Thu phóng một bố cục có bề rộng thiết kế cố định cho vừa khít khung chứa */
function FitToBox({ width, maxScale = 1.2, children }: { width: number; maxScale?: number; children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const update = () => setScale(Math.min(maxScale, outer.clientWidth / width, outer.clientHeight / inner.offsetHeight))
    const ro = new ResizeObserver(update)
    ro.observe(outer)
    ro.observe(inner)
    update()
    return () => ro.disconnect()
  }, [width, maxScale])

  return (
    <div ref={outerRef} className="flex h-full w-full items-center justify-center">
      <div ref={innerRef} className="shrink-0" style={{ width, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

const BOARD_TABS = [
  { id: 'letter', label: 'Thư mời', icon: 'compass' },
  { id: 'log', label: 'Hải trình', icon: 'anchor' },
  { id: 'wanted', label: 'Truy nã', icon: 'flag' },
] as const
type BoardTab = (typeof BOARD_TABS)[number]['id']

interface BoardProps {
  config: EventConfig
  guestName: string
  personalMessage?: string
}

type Fastener = 'tape' | 'tack' | 'nail'

/** Đồ ghim giấy lên vách: băng keo 2 góc, đinh ghim đồng, hoặc đinh sắt */
function PaperFastener({ kind }: { kind: Fastener }) {
  if (kind === 'tape') {
    return (
      <>
        <span className="washi-tape absolute -left-3 -top-2 z-10 h-8 w-28 -rotate-[24deg]" aria-hidden="true" />
        <span className="washi-tape absolute -right-3 -top-2 z-10 h-8 w-28 rotate-[22deg]" aria-hidden="true" />
      </>
    )
  }
  const head =
    kind === 'tack'
      ? 'h-6 w-6 bg-[radial-gradient(circle_at_35%_30%,#fff1b8_0%,#e0a93a_45%,#8a5a14_100%)]'
      : 'h-4 w-4 bg-[radial-gradient(circle_at_35%_30%,#f2f2f2_0%,#9a9a9a_45%,#3d3d3d_100%)]'
  return (
    <span className={`absolute left-1/2 z-10 -translate-x-1/2 ${kind === 'tack' ? 'top-2.5' : 'top-2'}`} aria-hidden="true">
      <span className="absolute left-1 top-1.5 h-full w-full rounded-full bg-black/45 blur-[2px]" />
      <span className={`relative block rounded-full ${head} ring-1 ring-black/30`} />
    </span>
  )
}

/** Tấm giấy ghim trên vách: rơi xuống đáp lên vách, đung đưa quanh chỗ ghim,
 *  bóng đổ 2 lớp; trên máy tính còn nghiêng 3D theo chuột và nhấc lên khi rê tới. */
function PaperProp({
  children,
  fastener,
  tilt = 0,
  delay = 0,
  swayDelay = 0,
  className = '',
}: {
  children: ReactNode
  fastener: Fastener
  tilt?: number
  delay?: number
  swayDelay?: number
  className?: string
}) {
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)')
  const [lifted, setLifted] = useState(false)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const lightX = useMotionValue(30)
  const lightY = useMotionValue(20)
  const rotateX = useSpring(rx, { stiffness: 160, damping: 18 })
  const rotateY = useSpring(ry, { stiffness: 160, damping: 18 })
  const sheen = useMotionTemplate`radial-gradient(circle at ${lightX}% ${lightY}%, rgba(255,250,232,0.55), transparent 55%)`

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 9)
    rx.set(-(py - 0.5) * 7)
    lightX.set(px * 100)
    lightY.set(py * 100)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
    setLifted(false)
  }

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ perspective: 1100 }}
      initial={{ opacity: 0, y: -80, rotate: tilt - 8, scale: 1.08 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ type: 'spring', stiffness: 110, damping: 13, delay }}
      onPointerEnter={() => fine && setLifted(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div className={`relative sway-${fastener}`} style={{ animationDelay: `${swayDelay}s` }}>
        {/* Bóng lan rộng trên vách: khi nhấc giấy lên thì bóng xa ra, nhòe và nhạt hơn */}
        <motion.div
          className="pointer-events-none absolute inset-x-[4%] bottom-[-2%] top-[5%] rounded-[36%] bg-black blur-2xl"
          initial={false}
          animate={lifted ? { opacity: 0.5, x: 10, y: 30, scale: 1.04 } : { opacity: 0.62, x: 4, y: 14, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          aria-hidden="true"
        />
        <motion.div
          className="relative will-change-transform"
          style={{ rotateX, rotateY }}
          initial={false}
          animate={lifted ? { y: -10, scale: 1.015 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        >
          <div className="paper-contact">{children}</div>
          {fine && (
            <motion.div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ backgroundImage: sheen, clipPath: TORN_EDGE }}
              initial={false}
              animate={{ opacity: lifted ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              aria-hidden="true"
            />
          )}
          <PaperFastener kind={fastener} />
        </motion.div>
      </div>
    </motion.div>
  )
}
/** Laptop / màn hình lớn: 3 tấm giấy nằm chung một màn hình, tự co giãn cho vừa */
function BoardWide({ config, guestName, personalMessage }: BoardProps) {
  return (
    <div className="relative h-dvh px-[3vw] pb-[96px] pt-[4vh]">
      <FitToBox width={1440}>
        <div className="grid grid-cols-[640px_450px_290px] items-center gap-[30px]">
          <PaperProp fastener="tape" tilt={-1.2}>
            <LetterScroll config={config} guestName={guestName} personalMessage={personalMessage} compact />
          </PaperProp>
          <PaperProp fastener="tack" tilt={1} delay={0.25} swayDelay={-2}>
            <VoyageLog config={config} guestName={guestName} compact />
          </PaperProp>
          <PaperProp fastener="nail" tilt={2.4} delay={0.5} swayDelay={-1}>
            <WantedPoster config={config} />
          </PaperProp>
        </div>
      </FitToBox>
    </div>
  )
}

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 70 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -70 }),
}

/** Điện thoại / máy tính bảng dọc: 3 tab chung một chỗ, bấm hoặc vuốt ngang để chuyển */
function BoardTabs({ config, guestName, personalMessage }: BoardProps) {
  const [tab, setTab] = useState<BoardTab>('letter')
  const [dir, setDir] = useState(1)
  const index = BOARD_TABS.findIndex((t) => t.id === tab)

  const go = (next: number) => {
    if (next < 0 || next >= BOARD_TABS.length || next === index) return
    setDir(next > index ? 1 : -1)
    setTab(BOARD_TABS[next].id)
    smoothScrollTo('#letter')
  }
  const nextTab = BOARD_TABS[index + 1]

  return (
    <div className="relative min-h-dvh px-4 pb-32 pt-16 sm:px-8">
      <div role="tablist" aria-label="Nội dung thiệp" className="mx-auto flex max-w-md gap-1 rounded-full border border-[#d9a441]/60 bg-[#0f2c4a]/80 p-1 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-md">
        {BOARD_TABS.map((t, i) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => go(i)}
              className="relative flex-1 cursor-pointer rounded-full px-2 py-2.5 font-heading text-[13px] font-bold transition-colors"
            >
              {active && (
                <motion.span layoutId="board-tab" className="absolute inset-0 rounded-full bg-[#f6e6c0] shadow-md" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
              )}
              <span className={`relative flex items-center justify-center gap-1.5 ${active ? 'text-[#3b2412]' : 'text-[#f6d48a]'}`}>
                <InkIcon name={t.icon} className="h-4 w-4" />
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mx-auto mt-8 max-w-[700px]">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: 'easeOut' }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -500) go(index + 1)
              else if (info.offset.x > 70 || info.velocity.x > 500) go(index - 1)
            }}
          >
            {tab === 'letter' && (
              <PaperProp fastener="tape" tilt={-0.8}>
                <LetterScroll config={config} guestName={guestName} personalMessage={personalMessage} />
              </PaperProp>
            )}
            {tab === 'log' && (
              <PaperProp fastener="tack" tilt={0.8}>
                <VoyageLog config={config} guestName={guestName} />
              </PaperProp>
            )}
            {tab === 'wanted' && (
              <PaperProp fastener="nail" tilt={2} className="pt-2">
                <WantedPoster config={config} />
              </PaperProp>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        {nextTab ? (
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d9a441]/70 bg-white/10 px-6 py-2.5 font-heading text-sm font-bold text-[#f6d48a] backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
          >
            Tiếp: {nextTab.label}
            <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(0)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d9a441]/70 bg-white/10 px-6 py-2.5 font-heading text-sm font-bold text-[#f6d48a] backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
          >
            <span aria-hidden="true">←</span> Đọc lại thư mời
          </button>
        )}
        <p className="font-letter text-[11px] italic text-white/55">Vuốt ngang để lật trang</p>
      </div>
    </div>
  )
}

/** Vách gỗ khoang tàu + đèn lồng chập chờn, nối mềm với biển ở màn đầu */
function CabinWall() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-cover bg-[50%_0%]" style={{ backgroundImage: `url(${ASSETS.cabinWall})` }} />
      <div className="lantern-glow absolute inset-0 origin-top" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgba(10,6,3,0.55)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#143f66] to-transparent" />
    </div>
  )
}

function VoyageBoard(props: BoardProps) {
  const wide = useMediaQuery('(min-width: 1180px) and (min-height: 600px)')
  return (
    <section id="letter" className="relative overflow-hidden bg-[#1c120b]">
      <CabinWall />
      {wide ? <BoardWide {...props} /> : <BoardTabs {...props} />}
    </section>
  )
}

/* ───────────────────────── Màn hình chính ───────────────────────── */

export default function MainInvitationScreen({
  guestName,
  personalMessage,
  music,
  onOpenOverlay,
  overlayOpen = false,
  revealed = true,
  textLag = 0,
}: MainInvitationScreenProps) {
  const config = useEventConfig()
  useSmoothScroll(overlayOpen)
  const [pastHero, setPastHero] = useState(false)

  // Thanh nút chức năng chỉ hiện sau khi cuộn khỏi màn hình đầu
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.5)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden bg-[#143f66]">
      <MusicButtons music={music} />
      <Hero config={config} guestName={guestName} revealed={revealed} textLag={textLag} />
      <VoyageBoard config={config} guestName={guestName} personalMessage={personalMessage} />
      <NavigationIcons onNavigate={onOpenOverlay} visible={pastHero} />
    </div>
  )
}
