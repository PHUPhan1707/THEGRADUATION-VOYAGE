import { useState, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { flushSync } from 'react-dom'
import { motion, AnimatePresence, animate, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import { submitRemoteRsvp } from '../../lib/api'
import { isSupabaseConfigured, updateLocalGuest } from '../../lib/storage'
import type { Guest } from '../../types'
import confetti from 'canvas-confetti'

interface RSVPSectionProps {
  guestName: string
  guest: Guest | null
  graduateName: string
}

type RSVPResponse = 'attending' | 'declined'

const MAX_MESSAGE_LENGTH = 500
/** Số lần Luffy chỉ kéo nút đi; lần kế tiếp là đấm văng nút ra góc (sau đó mới bấm được) */
const PULLS = 3
/** Con trỏ chuột vào gần nút "không tham dự" trong khoảng này (px) là bị giật đi */
const NEAR_PX = 450

/** Kéo chậm, dây thun dãn ra rồi mới tới nơi */
const PULL_SPRING = { type: 'spring', stiffness: 60, damping: 13 } as const

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** Cánh tay cao su của Luffy: tay áo đỏ ở (ox, oy), nắm đấm ở (fx, fy) */
function RubberArm({
  ox,
  oy,
  fx,
  fy,
  wobble,
  fistScale,
}: {
  ox: MotionValue<number>
  oy: MotionValue<number>
  fx: MotionValue<number>
  fy: MotionValue<number>
  wobble: MotionValue<number>
  fistScale: MotionValue<number>
}) {
  const d = useTransform(() => {
    const x0 = ox.get()
    const y0 = oy.get()
    const x1 = fx.get()
    const y1 = fy.get()
    const len = Math.hypot(x1 - x0, y1 - y0) || 1
    const nx = -(y1 - y0) / len
    const ny = (x1 - x0) / len
    const w = wobble.get()
    return `M ${x0} ${y0} Q ${(x0 + x1) / 2 + nx * w} ${(y0 + y1) / 2 + ny * w} ${x1} ${y1}`
  })
  const angle = useTransform(() => (Math.atan2(fy.get() - oy.get(), fx.get() - ox.get()) * 180) / Math.PI)

  return (
    <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible" aria-hidden="true">
      <motion.path d={d} fill="none" stroke="#7a3d17" strokeWidth="21" strokeLinecap="round" />
      <motion.path d={d} fill="none" stroke="#f6c995" strokeWidth="15" strokeLinecap="round" />
      <motion.circle cx={ox} cy={oy} r="17" fill="#c0392b" stroke="#7a1c12" strokeWidth="3" />
      <motion.g style={{ x: fx, y: fy, rotate: angle, scale: fistScale }}>
        <rect x="-16" y="-17" width="30" height="34" rx="12" fill="#f6c995" stroke="#7a3d17" strokeWidth="3" />
        <path d="M 4 -15 V 15 M -5 -16 V 16" stroke="#b9774a" strokeWidth="2" strokeLinecap="round" />
        <path d="M 6 -9 h 7 M 6 0 h 7 M 6 9 h 7" stroke="#7a3d17" strokeWidth="2.4" strokeLinecap="round" />
      </motion.g>
    </svg>
  )
}

/** Chữ tượng thanh "BỐP!" kiểu truyện tranh ở chỗ cú đấm trúng */
function ImpactBurst({ x, y }: { x: number; y: number }) {
  const spikes = Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 ? 30 : 58
    const a = (i / 24) * Math.PI * 2
    return `${Math.cos(a) * r},${Math.sin(a) * r * 0.8}`
  }).join(' ')
  return (
    <motion.div
      className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
      initial={{ scale: 0, rotate: -20, opacity: 1 }}
      animate={{ scale: [0, 1.35, 1.1, 1.15], rotate: [-20, 6, 0, 0], opacity: [1, 1, 1, 0] }}
      transition={{ duration: 1, times: [0, 0.15, 0.7, 1], ease: 'easeOut' }}
      aria-hidden="true"
    >
      <svg viewBox="-64 -52 128 104" className="h-[104px] w-[128px] overflow-visible">
        <polygon points={spikes} fill="#ffd23f" stroke="#c0392b" strokeWidth="4" strokeLinejoin="round" />
        <text x="0" y="9" textAnchor="middle" fontFamily="Anton, Impact, 'Be Vietnam Pro', sans-serif" fontSize="30" fill="#c0392b" stroke="#fff" strokeWidth="1.2">
          BỐP!
        </text>
      </svg>
    </motion.div>
  )
}
export default function RSVPSection({ guestName, guest, graduateName }: RSVPSectionProps) {
  const [response, setResponse] = useState<RSVPResponse | null>(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Trò đùa "Gomu Gomu no...": cánh tay Luffy giật nút "không tham dự" đi chỗ khác
  const formRef = useRef<HTMLDivElement>(null)
  const declineRef = useRef<HTMLButtonElement>(null)
  const busy = useRef(false)
  const [yanks, setYanks] = useState(0)
  const [armVisible, setArmVisible] = useState(false)
  const [gaveUp, setGaveUp] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )
  const [punching, setPunching] = useState(false)
  const [knocked, setKnocked] = useState<{ w: number; h: number } | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null)
  const bx = useMotionValue(0)
  const by = useMotionValue(0)
  const brot = useMotionValue(0)
  const bscale = useMotionValue(1)
  const ox = useMotionValue(0)
  const oy = useMotionValue(0)
  const fx = useMotionValue(0)
  const fy = useMotionValue(0)
  const wobble = useMotionValue(0)
  const fistScale = useMotionValue(1)
  const shake = useMotionValue(0)

  /** Lần thứ PULLS + 1: "Gomu Gomu no... Pistol!" đấm nút văng xuống góc dưới bên phải */
  const punchAway = async (btn: HTMLButtonElement, cx: number, cy: number) => {
    setPunching(true)

    // Lấy đà: vươn ra một chút rồi rụt hẳn về sau, nắm đấm phình to
    await Promise.all([
      animate(fx, cx * 0.3, { duration: 0.4, ease: 'easeOut' }),
      animate(wobble, [0, -18, 0], { duration: 0.4 }),
    ])
    await Promise.all([
      animate(fx, -70, { duration: 0.45, ease: [0.3, 0, 0.2, 1] }),
      animate(fistScale, 1.5, { duration: 0.45 }),
      animate(wobble, [0, 22, -10, 0], { duration: 0.45 }),
    ])
    await sleep(160)

    // Đấm!
    const hitX = cx - btn.offsetWidth / 2 + 14
    await Promise.all([
      animate(fx, hitX, { duration: 0.13, ease: 'easeIn' }),
      animate(fistScale, 2.1, { duration: 0.13, ease: 'easeIn' }),
    ])
    setBurst({ x: hitX + 10, y: cy, id: Date.now() })
    void animate(shake, [0, -11, 9, -6, 4, -2, 0], { duration: 0.4 })

    // Nút rời khỏi lưới (không để lại khoảng trống) và neo ở góc dưới bên phải của khung.
    // Bù lại độ dời ngay trong cùng khung hình để nút không nhảy.
    const before = btn.getBoundingClientRect()
    const w = btn.offsetWidth
    const h = btn.offsetHeight
    flushSync(() => setKnocked({ w, h }))
    const after = btn.getBoundingClientRect()
    bx.set(bx.get() + before.left - after.left)
    by.set(by.get() + before.top - after.top)
    const s = 0.62
    const tx = (w * (1 - s)) / 2 - 4
    const ty = (h * (1 - s)) / 2 - 4

    const fly = { duration: 0.6, ease: [0.12, 0.85, 0.3, 1] } as const
    await Promise.all([
      animate(bx, tx, fly),
      animate(by, [by.get(), Math.min(by.get(), ty) - 50, ty], { duration: 0.6, times: [0, 0.35, 1], ease: 'easeOut' }),
      animate(brot, 360 + 348, fly),
      animate(bscale, s, fly),
      animate(fx, -34, { duration: 0.4, delay: 0.12, ease: 'easeOut' }),
      animate(fy, oy.get(), { duration: 0.4, delay: 0.12 }),
      animate(fistScale, 1, { duration: 0.4, delay: 0.12 }),
    ])
    setArmVisible(false)
    // Rơi xuống nảy nhẹ, nằm nghiêng ở góc
    await animate(brot, [708, 700, 712, 708], { duration: 0.45 })
    brot.set(-12)
    setYanks((n) => n + 1)
    setPunching(false)
    setGaveUp(true)
  }

  const yank = async (pointer?: { x: number; y: number }) => {
    const form = formRef.current
    const btn = declineRef.current
    if (busy.current || gaveUp || !form || !btn) return
    busy.current = true

    const c = form.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    const cx = b.left - c.left + b.width / 2
    const cy = b.top - c.top + b.height / 2
    // Vị trí gốc của nút (bỏ phần đang bị dời)
    const homeLeft = b.left - c.left - bx.get()
    const homeTop = b.top - c.top - by.get()

    ox.set(-34)
    oy.set(cy)
    fx.set(-34)
    fy.set(cy)
    wobble.set(0)
    fistScale.set(1)
    setArmVisible(true)

    if (yanks >= PULLS) {
      await punchAway(btn, cx, cy)
      busy.current = false
      return
    }

    // 1. Thong thả vươn tay tới nút, dây thun lắc lư
    await Promise.all([
      animate(fx, cx, { duration: 0.6, ease: [0.25, 0.8, 0.3, 1] }),
      animate(wobble, [0, -32, 14, 0], { duration: 0.6 }),
    ])
    // Tóm lấy: nắm đấm siết lại
    await animate(fistScale, [1, 0.82, 1.05], { duration: 0.25 })

    // 2. Kéo đi thật chậm
    let nextX: number
    let nextY: number
    const snapBack = !pointer || b.width > c.width * 0.7
    if (snapBack) {
      // Điện thoại (nút chiếm cả bề ngang): lôi ra khỏi khung rồi bật ngược về
      nextX = -(homeLeft + b.width + 60)
      nextY = by.get()
    } else {
      // Không thả đè lên nút "có mặt" và nút gửi (đè lên ô lời nhắn thì được: rê chuột tới là nó lại bị giật đi)
      const blockers = [...form.querySelectorAll<HTMLElement>('[data-keep-clear]')].map((el) => {
        const r = el.getBoundingClientRect()
        return { l: r.left - c.left - 10, t: r.top - c.top - 10, r: r.right - c.left + 10, b: r.bottom - c.top + 10 }
      })
      let best = { x: 0, y: 0, score: -1 }
      for (let i = 0; i < 60; i++) {
        const left = Math.random() * Math.max(0, c.width - b.width)
        const top = Math.random() * Math.max(0, c.height - b.height)
        if (blockers.some((k) => left < k.r && left + b.width > k.l && top < k.b && top + b.height > k.t)) continue
        const score = Math.hypot(left + b.width / 2 - (pointer.x - c.left), top + b.height / 2 - (pointer.y - c.top))
        if (score > best.score) best = { x: left - homeLeft, y: top - homeTop, score }
      }
      nextX = best.score < 0 ? 0 : best.x
      nextY = best.score < 0 ? 0 : best.y
    }
    const moveX = nextX - bx.get()
    const moveY = nextY - by.get()
    await Promise.all([
      animate(bx, nextX, PULL_SPRING),
      animate(by, nextY, PULL_SPRING),
      animate(fx, cx + moveX, PULL_SPRING),
      animate(fy, cy + moveY, PULL_SPRING),
      animate(oy, cy + moveY * 0.6, PULL_SPRING),
      animate(wobble, [0, 46, -28, 16, -6, 0], { duration: 1.3 }),
    ])

    // 3. Buông ra, rụt tay về
    await Promise.all([
      animate(fx, -34, { duration: 0.45, ease: 'easeInOut' }),
      animate(fy, oy.get(), { duration: 0.45, ease: 'easeInOut' }),
      animate(wobble, [0, -20, 0], { duration: 0.45 }),
    ])
    setArmVisible(false)
    setYanks((n) => n + 1)

    if (snapBack) {
      await sleep(500)
      await animate(bx, 0, { type: 'spring', stiffness: 260, damping: 13 })
    }
    busy.current = false
  }
  const handlePointerMove = (e: ReactPointerEvent) => {
    if (e.pointerType !== 'mouse' || gaveUp || busy.current || !declineRef.current) return
    const r = declineRef.current.getBoundingClientRect()
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right)
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom)
    if (Math.hypot(dx, dy) < NEAR_PX) void yank({ x: e.clientX, y: e.clientY })
  }

  // Pre-fill from existing RSVP
  useEffect(() => {
    if (guest?.rsvpStatus && guest.rsvpStatus !== 'pending') {
      setResponse(guest.rsvpStatus as RSVPResponse)
      if (guest.rsvpStatus === 'declined') setGaveUp(true)
      if (guest.rsvpMessage) {
        setMessage(guest.rsvpMessage)
      }
    } else {
      const stored = localStorage.getItem(`rsvp_${guestName}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (parsed.response) setResponse(parsed.response)
          if (parsed.response === 'declined') setGaveUp(true)
          if (parsed.message) setMessage(parsed.message)
        } catch {
          // ignore
        }
      }
    }
  }, [guest, guestName])

  const handleSubmit = async () => {
    if (!response || submitting) return
    setSubmitting(true)
    setError('')
    const trimmed = message.trim().slice(0, MAX_MESSAGE_LENGTH)
    try {
      if (guest?.inviteId && isSupabaseConfigured()) {
        // Lưu tập trung trên Supabase (qua hàm submit_rsvp) để chủ thiệp thấy được
        await submitRemoteRsvp(guest.inviteId, response, trimmed)
      } else if (guest?.id) {
        updateLocalGuest(guest.id, { rsvpStatus: response, rsvpMessage: trimmed })
      } else {
        // Thiệp dạng ?to=Tên: chỉ lưu trên thiết bị của khách
        localStorage.setItem(
          `rsvp_${guestName}`,
          JSON.stringify({ response, message: trimmed, updatedAt: new Date().toISOString() }),
        )
      }

      if (response === 'attending' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D9A441', '#183A59', '#E74C3C', '#2ECC71'],
          zIndex: 200,
        })
      }
      setMessage(trimmed)
      setSubmitted(true)
    } catch (err) {
      console.error('RSVP error:', err)
      setError('Chưa gửi được phản hồi. Bạn kiểm tra mạng rồi thử lại nhé!')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full text-navy">
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`relative space-y-5 ${knocked ? 'pb-24' : ''}`}
            style={{ x: shake }}
            ref={formRef}
            onPointerMove={handlePointerMove}
          >
            {armVisible && <RubberArm ox={ox} oy={oy} fx={fx} fy={fy} wobble={wobble} fistScale={fistScale} />}
            {burst && <ImpactBurst key={burst.id} x={burst.x} y={burst.y} />}
            {/* Subtitle / Question */}
            <div className="text-center">
              <p className="font-heading text-lg md:text-xl font-bold text-navy">
                Bạn sẽ đồng hành cùng mình chứ?
              </p>
              <p className="text-xs text-navy/60 italic mt-0.5">
                Lời mời dành riêng cho <span className="font-bold text-navy">{guestName}</span>
              </p>
            </div>

            {/* Attendance Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Attending */}
              <button
                type="button"
                data-keep-clear
                onClick={() => setResponse('attending')}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${response === 'attending'
                    ? 'border-[#1E5B8E] bg-[#184674] text-white shadow-lg scale-[1.02]'
                    : 'border-treasure-gold/40 bg-white/70 hover:bg-white text-navy shadow-sm'
                  }`}
              >
                {/* Straw Hat Icon */}
                <div className="text-3xl mb-1 filter drop-shadow">
                  👒
                </div>
                <span className="font-heading font-bold text-sm tracking-wide">
                  Tôi sẽ có mặt!
                </span>
                <span className={`text-[10px] mt-0.5 ${response === 'attending' ? 'text-white/80' : 'text-navy/60'}`}>
                  Căng buồm cùng thuyền trưởng
                </span>
              </button>

              {/* Option 2: Declined */}
              <motion.button
                ref={declineRef}
                type="button"
                style={{ x: bx, y: by, rotate: brot, scale: bscale, width: knocked?.w, height: knocked?.h }}
                onClick={(e) => {
                  if (!gaveUp) {
                    const isMouse = e.detail > 0 && (e.nativeEvent as PointerEvent).pointerType === 'mouse'
                    void yank(isMouse ? { x: e.clientX, y: e.clientY } : undefined)
                    return
                  }
                  setResponse('declined')
                }}
                className={`${knocked ? 'absolute right-0 bottom-0' : 'relative'} z-20 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors cursor-pointer ${response === 'declined'
                    ? 'border-coral bg-[#fdecea] text-coral shadow-md'
                    : 'border-treasure-gold/40 bg-[#fffaf0] hover:bg-white text-navy shadow-sm'
                  }`}
              >
                {/* Red Cross Icon */}
                <div className="text-3xl mb-1 text-red-500 font-bold">
                  ✕
                </div>
                <span className="font-heading font-bold text-sm tracking-wide text-red-600">
                  Tiếc quá, tôi không thể tham dự
                </span>
                <span className="text-[10px] mt-0.5 text-navy/60">
                  Hẹn gặp ở vùng biển khác nhé
                </span>
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
              {(yanks > 0 || punching) && (
                <motion.p
                  key={punching ? 'punch' : knocked ? 'knocked' : gaveUp ? 'gave-up' : 'no-way'}
                  className="-mt-2 text-center font-handwriting text-lg font-bold text-[#a8261a]"
                  initial={{ opacity: 0, y: 6, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  aria-live="polite"
                >
                  {punching
                    ? 'Luffy: “Gomu Gomu no... PISTOL!!” 👊'
                    : knocked
                      ? 'Luffy: “Shishishi! Muốn từ chối thì ra góc mà bấm nhé~” 😆'
                      : gaveUp
                        ? 'Luffy: “Hừm... thôi được, nhưng tiếc lắm đó!” 🥲'
                        : 'Luffy: “Không được từ chối! Shishishi~” 👒'}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Message Textarea */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-navy/70 mb-1.5">
                Gửi lời nhắn <span className="text-navy/40 font-normal">(không bắt buộc)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder={`Viết lời nhắn gửi đến thuyền trưởng ${graduateName}...`}
                className="w-full px-4 py-3 rounded-lg border border-treasure-gold/40 bg-white/90 text-navy text-base placeholder:text-navy/40 outline-none focus:ring-2 focus:ring-treasure-gold/50 focus:border-treasure-gold transition-all resize-none shadow-inner"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <div className="text-center pt-1">
              <button
                type="button"
                data-keep-clear
                onClick={handleSubmit}
                disabled={!response || submitting}
                className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 rounded-lg font-heading text-sm font-bold tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #183A59 0%, #1A4F7C 50%, #20639B 100%)',
                  border: '1px solid rgba(217, 164, 65, 0.7)',
                }}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang gửi...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span>➤</span>
                    <span>GỬI LỜI NHẮN</span>
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="text-5xl">
              {response === 'attending' ? '🎉' : '💙'}
            </div>

            <h3 className="font-heading text-xl md:text-2xl font-bold text-navy">
              {response === 'attending'
                ? 'Hẹn gặp bạn tại bến cảng tốt nghiệp!'
                : 'Cảm ơn bạn đã phản hồi!'}
            </h3>

            <p className="text-sm text-navy/70 max-w-md mx-auto leading-relaxed">
              {response === 'attending'
                ? `Tuyệt vời! Thuyền trưởng ${graduateName} rất mong được cùng ${guestName} lưu giữ những khoảnh khắc đáng nhớ trong ngày trọng đại này!`
                : `Dù không thể tham dự, sự đồng hành và những kỷ niệm của ${guestName} trong suốt chặng đường qua luôn là kho báu quý giá.`}
            </p>

            {message && (
              <div className="p-3.5 rounded-lg bg-navy/5 border border-treasure-gold/30 text-xs italic text-navy/80 max-w-sm mx-auto">
                "{message}"
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-xs text-navy/60 hover:text-navy underline underline-offset-4 cursor-pointer transition-colors"
              >
                Chỉnh sửa lại phản hồi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
