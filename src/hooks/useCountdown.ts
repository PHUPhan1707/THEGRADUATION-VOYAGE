import { useState, useEffect } from 'react'

interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  hasCeremonyTime: boolean
}

export function useCountdown(targetDate: string, ceremonyTime?: string | null): CountdownResult {
  const hasCeremonyTime = !!ceremonyTime
  
  const getTarget = () => {
    const dateStr = targetDate
    if (hasCeremonyTime) {
      return new Date(`${dateStr}T${ceremonyTime}:00+07:00`).getTime()
    }
    // If no ceremony time, target end of the day (just show days)
    return new Date(`${dateStr}T23:59:59+07:00`).getTime()
  }

  const [timeLeft, setTimeLeft] = useState<CountdownResult>(() => {
    const diff = getTarget() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, hasCeremonyTime }
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      isExpired: false,
      hasCeremonyTime,
    }
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = getTarget() - Date.now()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, hasCeremonyTime })
        clearInterval(timer)
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        isExpired: false,
        hasCeremonyTime,
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, ceremonyTime])

  return timeLeft
}
