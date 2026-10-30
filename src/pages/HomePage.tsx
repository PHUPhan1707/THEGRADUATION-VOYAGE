import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ASSETS } from '../lib/assets'
import { buildInviteUrl, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH } from '../lib/inviteLink'

/** Trang tạo link thiệp: gõ tên khách → có ngay link `/invite#...` để gửi qua Zalo / Messenger */
export default function HomePage() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const trimmed = name.trim()
  const url = useMemo(() => (trimmed ? buildInviteUrl({ name: trimmed, message }) : ''), [trimmed, message])
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => setCopied(false), [url])

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const area = document.createElement('textarea')
      area.value = url
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setCopied(true)
  }

  const share = () => {
    if (!url) return
    void navigator.share({ title: 'The Graduation Voyage', text: `Gửi ${trimmed} – thiệp mời tốt nghiệp của mình nè!`, url }).catch(() => {})
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-navy">
      <img src={ASSETS.bgLandscape} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/70 via-navy/60 to-navy/90" />

      <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
        <header className="mb-6 text-center">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.35em] text-treasure-gold/80">Xưởng in thiệp</p>
          <h1 className="font-display mt-2 text-4xl tracking-wide text-treasure-gold md:text-5xl">THE GRADUATION VOYAGE</h1>
          <p className="font-body mt-2 text-sm text-parchment/80">Gõ tên người nhận để tạo link thiệp riêng cho từng người.</p>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-treasure-gold/40 bg-[#fbf3e0] p-5 shadow-2xl md:p-7"
        >
          <label className="block">
            <span className="font-body text-xs font-bold uppercase tracking-wider text-navy/70">Tên người nhận</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              placeholder="VD: Lê Giang Thanh Thủy"
              autoFocus
              className="font-body mt-1.5 w-full rounded-xl border-2 border-treasure-gold/40 bg-white/80 px-4 py-3 text-lg text-navy outline-none focus:border-[#184674]"
            />
          </label>

          <label className="mt-4 block">
            <span className="font-body text-xs font-bold uppercase tracking-wider text-navy/70">
              Lời nhắn riêng <span className="font-normal normal-case text-navy/50">(không bắt buộc, hiện trong thư mời)</span>
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
              rows={3}
              placeholder="VD: Nhất định phải tới nha, có chụp hình chung đó!"
              className="font-body mt-1.5 w-full resize-none rounded-xl border-2 border-treasure-gold/40 bg-white/80 px-4 py-3 text-navy outline-none focus:border-[#184674]"
            />
          </label>

          <AnimatePresence initial={false}>
            {url && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-5 rounded-xl border border-dashed border-[#184674]/40 bg-white/60 p-3">
                  <p className="font-body break-all text-xs text-navy/70">{url}</p>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={copy}
                    className="font-body rounded-xl bg-[#184674] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1E5B8E] active:scale-95"
                  >
                    {copied ? '✓ Đã sao chép' : 'Sao chép link'}
                  </button>
                  {canShare && (
                    <button
                      type="button"
                      onClick={share}
                      className="font-body rounded-xl bg-treasure-gold px-4 py-3 text-sm font-bold text-navy shadow-md transition hover:bg-gold-light active:scale-95"
                    >
                      Gửi qua ứng dụng…
                    </button>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className={`font-body rounded-xl border-2 border-[#184674]/40 px-4 py-3 text-center text-sm font-bold text-[#184674] transition hover:bg-white active:scale-95 ${canShare ? '' : 'sm:col-span-2'}`}
                  >
                    Xem thử thiệp
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>
    </div>
  )
}
