import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import { ASSETS } from '../../lib/assets'
import { useMediaQuery } from '../../hooks/useMediaQuery'

interface SeagullIntroProps {
  guestName: string
  graduateName: string
  /** Gọi ngay trong sự kiện chạm (bật nhạc – trình duyệt chỉ cho phép sau thao tác người dùng) */
  onStart?: () => void
  /** Dựng trang chính bên dưới (có thể gọi nhiều lần) */
  onReveal: () => void
  /** Hiệu ứng kết thúc: gỡ màn mở đầu */
  onDone: () => void
}

/** Chim đưa tin News Coo – sprite 3 khung hòa trộn; mặc định lượn, `flapping` để vỗ liên tục */
function NewsCoo({
  className = '',
  cycle,
  delay,
  flapping = false,
  gliding = false,
  mirror = false,
}: {
  className?: string
  cycle?: string
  delay?: string
  flapping?: boolean
  /** Khóa cánh ngang, không vỗ */
  gliding?: boolean
  mirror?: boolean
}) {
  const vars = { '--coo-cycle': cycle, '--coo-delay': delay } as CSSProperties
  const mode = gliding ? 'is-gliding' : flapping ? 'is-flapping' : ''
  return (
    <div className={className} style={mirror ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <div className={`news-coo ${mode}`} style={cycle || delay ? vars : undefined}>
        <span className="coo-up" />
        <span className="coo-mid" />
        <span className="coo-down" />
      </div>
    </div>
  )
}

/** Những con hải âu nhỏ lượn quanh (bay xa, theo đường lượn sóng) */
const SMALL_BIRDS = [
  { top: '12%', size: 64, dur: 22, delay: -3, toRight: false, opacity: 0.9, cycle: '9s' },
  { top: '24%', size: 42, dur: 28, delay: -16, toRight: true, opacity: 0.75, cycle: '11s' },
  { top: '7%', size: 34, dur: 32, delay: -9, toRight: true, opacity: 0.6, cycle: '13s' },
  { top: '34%', size: 50, dur: 25, delay: -20, toRight: false, opacity: 0.7, cycle: '10s' },
  { top: '18%', size: 28, dur: 36, delay: -27, toRight: false, opacity: 0.55, cycle: '12s' },
]

type Phase = 'idle' | 'leaving'

export default function SeagullIntro({ guestName, graduateName, onStart, onReveal, onDone }: SeagullIntroProps) {
  const isPortrait = useMediaQuery('(max-aspect-ratio: 9/10)')
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [phase, setPhase] = useState<Phase>('idle')
  const [revealed, setRevealed] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers
    return () => pending.current.forEach((id) => window.clearTimeout(id))
  }, [])

  // Dựng sẵn trang chính (bị màn mở đầu che) khi chim đã lượn vào xong, để lúc chạm không bị giật
  const onRevealRef = useRef(onReveal)
  useEffect(() => {
    onRevealRef.current = onReveal
  }, [onReveal])
  useEffect(() => {
    const id = window.setTimeout(() => onRevealRef.current(), 2600)
    return () => window.clearTimeout(id)
  }, [])

  const handleOpen = () => {
    if (phase !== 'idle') return
    onStart?.()
    setPhase('leaving')
    onReveal()
    const revealAt = reduceMotion ? 200 : 1000
    const doneAt = reduceMotion ? 900 : 2100
    timers.current = [
      window.setTimeout(() => setRevealed(true), revealAt),
      window.setTimeout(onDone, doneAt),
    ]
  }

  const leaving = phase === 'leaving'

  return (
    <div className={`fixed inset-0 z-[200] overflow-hidden ${revealed ? 'pointer-events-none' : ''}`}>
      {/* Bầu trời + biển, mờ dần khi chim bay đi */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: revealed ? 0 : 1,
          x: leaving && !reduceMotion ? [0, -4, 3, 0] : 0,
          y: leaving && !reduceMotion ? [0, 3, -2, 0] : 0,
        }}
        transition={{
          opacity: { duration: 1, ease: 'easeInOut' },
          x: { duration: 0.7, delay: 0.9, ease: 'easeInOut' },
          y: { duration: 0.7, delay: 0.9, ease: 'easeInOut' },
        }}
      >
        <img
          src={isPortrait ? ASSETS.bgPortrait : ASSETS.bgLandscape}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
          style={{ objectPosition: isPortrait ? '50% 50%' : '55% 45%' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,40,72,0.15) 0%, rgba(8,28,52,0.55) 55%, rgba(6,18,34,0.88) 100%)',
          }}
        />

        {!reduceMotion &&
          SMALL_BIRDS.map((b, i) => (
            <motion.div
              key={i}
              className="absolute left-0"
              style={{ top: b.top, width: b.size, opacity: b.opacity }}
              initial={{ x: b.toRight ? '-15vw' : '110vw' }}
              animate={{ x: b.toRight ? '110vw' : '-15vw', y: [0, 26, -8, 18, 0], rotate: [0, -5, 3, -3, 0] }}
              transition={{
                x: { duration: b.dur, repeat: Infinity, ease: 'linear', delay: b.delay },
                y: { duration: b.dur / 2.5, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: b.dur / 2.5, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <NewsCoo mirror={b.toRight} cycle={b.cycle} delay={`${i * -2.3}s`} />
            </motion.div>
          ))}
      </motion.div>

      {/* Bóng chim lướt qua sát ống kính */}
      {leaving && !reduceMotion && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{ background: 'radial-gradient(ellipse at 30% 75%, rgba(4,14,28,0.55) 0%, rgba(4,14,28,0) 70%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 0] }}
          transition={{ duration: 1.75, times: [0, 0.55, 0.85, 1], ease: 'easeInOut' }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {/* News Coo chính: lượn vào, khóa cánh lượn theo gió; chạm thì nghiêng người lượn vòng đi xa */}
        <motion.div
          className="pointer-events-none relative z-30 w-[min(80vw,440px)] sm:w-[min(42vw,58vh,560px)]"
          aria-hidden="true"
          initial={reduceMotion ? false : { x: '75vw', y: -160, scale: 0.45, rotate: -8 }}
          style={{ willChange: 'transform, opacity' }}
          animate={
            leaving
              ? {
                  x: ['0vw', '4vw', '-100vw'],
                  y: ['0vh', '-4vh', '80vh'],
                  rotate: [0, 8, -32],
                  scale: [1, 0.94, 7],
                  opacity: [1, 1, 0],
                }
              : { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }
          }
          transition={
            leaving
              ? {
                  duration: 1.75,
                  times: [0, 0.3, 1],
                  ease: [[0.33, 0, 0.4, 1], [0.55, 0, 0.85, 0.45]],
                  opacity: { duration: 1.75, times: [0, 0.8, 1], ease: 'easeIn' },
                }
              : { duration: 2.4, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <motion.div
            animate={
              leaving || reduceMotion
                ? { x: 0, y: 0, rotate: 0 }
                : { x: ['0vw', '-5vw', '-2vw', '4vw', '0vw'], y: [0, 34, 8, -22, 0], rotate: [0, -6, 2, 5, 0] }
            }
            transition={
              leaving
                ? { duration: 0.4, ease: 'easeOut' }
                : { duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2.2 }
            }
          >
            {/* Cánh rung nhẹ trong gió khi lao đi */}
            <motion.div
              animate={leaving ? { scaleY: [1, 0.95, 1] } : { scaleY: 1 }}
              transition={leaving ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
            >
              <NewsCoo
                gliding={leaving}
                className={leaving ? '' : 'drop-shadow-[0_18px_22px_rgba(0,15,35,0.45)]'}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center"
          animate={leaving ? { opacity: 0, y: 24 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeIn' }}
        >
          <motion.p
            className="font-heading text-[11px] font-semibold uppercase tracking-[0.45em] text-[#ffe2a8] sm:text-xs"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
          >
            Chim đưa tin mang thư đến
          </motion.p>
          <motion.p
            className="guest-name mt-1 font-handwriting text-[clamp(3rem,13vw,5.5rem)] font-bold leading-[1.1]"
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1, delay: 1.8 }}
          >
            {guestName}
          </motion.p>
          <motion.p
            className="mt-1 font-heading text-sm italic text-white/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.1 }}
          >
            từ thuyền trưởng {graduateName}
          </motion.p>

          <motion.button
            type="button"
            onClick={handleOpen}
            className="group mt-8 flex cursor-pointer flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 2.3, type: 'spring', stiffness: 200, damping: 14 }}
            aria-label="Mở thư mời"
          >
            <span className="wax-seal relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full text-3xl text-[#ffd9a0] transition-transform group-hover:scale-105 group-active:scale-95">
              <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-[#ffd9a0]/50" aria-hidden="true" />
              <span aria-hidden="true">☠</span>
            </span>
            <span className="font-heading text-[11px] font-semibold uppercase tracking-[0.4em] text-white/85">
              Chạm để nhận thư
            </span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
