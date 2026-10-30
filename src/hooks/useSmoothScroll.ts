import { useEffect } from 'react'
import Lenis from 'lenis'

let instance: Lenis | null = null

/** Cuộn mượt (quán tính) cho cả trang. Tắt khi người dùng bật "giảm chuyển động". */
export function useSmoothScroll(paused = false) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    instance = lenis
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    })
    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      instance = null
    }
  }, [])

  useEffect(() => {
    if (paused) instance?.stop()
    else instance?.start()
  }, [paused])
}

export function smoothScrollTo(target: string) {
  if (instance) instance.scrollTo(target, { offset: -8 })
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
