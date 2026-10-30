import type { ReactNode } from 'react'
import { motion } from 'motion/react'

/** Mép giấy rách: đa giác răng cưa cố định (không đổi giữa các lần render) */
export const TORN_EDGE = (() => {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const n = 36
  const jag = () => (2 + rand() * 7).toFixed(1)
  const pts: string[] = []
  for (let i = 0; i <= n; i++) pts.push(`${((i / n) * 100).toFixed(2)}% ${jag()}px`)
  for (let i = 1; i <= n; i++) pts.push(`calc(100% - ${jag()}px) ${((i / n) * 100).toFixed(2)}%`)
  for (let i = n - 1; i >= 0; i--) pts.push(`${((i / n) * 100).toFixed(2)}% calc(100% - ${jag()}px)`)
  for (let i = n - 1; i >= 1; i--) pts.push(`${jag()}px ${((i / n) * 100).toFixed(2)}%`)
  return `polygon(${pts.join(', ')})`
})()

/** Nét gạch mực tự vẽ khi cuộn tới */
export function InkSwash({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 14" className={`text-[#8a5a2b] ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <motion.path
        d="M4 9 C 50 2, 90 13, 130 6 S 200 4, 216 8"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.3 }}
      />
    </svg>
  )
}

/** Con dấu đóng mạnh xuống giấy khi cuộn tới */
export function StampIn({ children, rotate, delay = 0, className = '' }: { children: ReactNode; rotate: number; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 2.4, rotate: rotate - 30 }}
      whileInView={{ opacity: 1, scale: 1, rotate }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{ type: 'spring', stiffness: 420, damping: 15, delay }}
    >
      {children}
    </motion.div>
  )
}
