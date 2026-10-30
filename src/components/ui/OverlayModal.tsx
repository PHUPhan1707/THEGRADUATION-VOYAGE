import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useId, useRef } from 'react'

interface OverlayModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  /** Optional title shown in the header */
  title?: string
  /** Optional icon/emoji before the title */
  icon?: string
  /** Whether to use a parchment-style background (default) or dark background */
  variant?: 'parchment' | 'dark' | 'sunset'
  /** Max width class override */
  maxWidth?: string
}

export default function OverlayModal({
  isOpen,
  onClose,
  children,
  title,
  icon,
  variant = 'parchment',
  maxWidth = 'max-w-3xl',
}: OverlayModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Khóa cuộn nền khi mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Esc để đóng + giữ focus trong popup (focus trap) + trả focus về nút đã mở
  useEffect(() => {
    if (!isOpen) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      previouslyFocused?.focus?.()
    }
  }, [isOpen])

  const bgStyles = {
    parchment: {
      background: 'var(--color-parchment)',
      border: '2px solid rgba(217, 164, 65, 0.5)',
      boxShadow: '0 12px 48px rgba(0,0,0,0.5), inset 0 0 60px rgba(139, 90, 43, 0.06)',
    },
    dark: {
      background: 'linear-gradient(180deg, rgba(24, 58, 89, 0.98) 0%, rgba(13, 33, 55, 0.99) 100%)',
      border: '2px solid rgba(217, 164, 65, 0.3)',
      boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
    },
    sunset: {
      background: 'linear-gradient(180deg, #1a1a3e 0%, #2d1b4e 15%, #8b3a62 30%, #d4614b 45%, #e8945a 55%, #f0b86e 65%, #d4884a 72%, #3a6186 82%, #1a3a5c 92%, #0f2740 100%)',
      border: '2px solid rgba(217, 164, 65, 0.3)',
      boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
    },
  }

  const textColor = variant === 'parchment' ? 'text-navy' : 'text-parchment'
  const closeHoverBg = variant === 'parchment' ? 'hover:bg-navy/10' : 'hover:bg-white/10'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal content */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Hộp thoại'}
            className={`relative z-10 w-full ${maxWidth} max-h-[92dvh] overflow-y-auto rounded-t-2xl rounded-b-none sm:max-h-[90dvh] sm:rounded-xl ${textColor}`}
            style={{ ...bgStyles[variant], paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Parchment texture overlay */}
            {variant === 'parchment' && (
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
                  zIndex: 1,
                }}
              />
            )}

            {/* Close button */}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className={`absolute top-3 right-3 z-20 w-10 h-10 rounded-full flex items-center justify-center ${closeHoverBg} transition-colors cursor-pointer`}
              aria-label="Đóng"
            >
              <span className={`text-lg ${variant === 'parchment' ? 'text-navy/60' : 'text-parchment/60'}`}>✕</span>
            </button>

            {/* Header */}
            {title && (
              <div className="relative z-10 pt-5 px-6 pb-3 text-center">
                {icon && <span className="text-2xl mb-1 block">{icon}</span>}
                <h2
                  id={titleId}
                  className={`font-heading text-xl md:text-2xl font-bold ${variant === 'parchment' ? 'text-treasure-gold' : 'text-treasure-gold'
                    }`}
                  style={{ textShadow: variant === 'parchment' ? '0 2px 4px rgba(139, 90, 43, 0.2)' : '0 0 15px rgba(217, 164, 65, 0.3)' }}
                >
                  {title}
                </h2>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <div className="h-px w-10 bg-treasure-gold/30" />
                  <span className="text-treasure-gold text-sm">⚓</span>
                  <div className="h-px w-10 bg-treasure-gold/30" />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 px-5 pb-6 md:px-8 md:pb-8">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
