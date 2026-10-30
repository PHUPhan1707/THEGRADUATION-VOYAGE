import { useCallback, useEffect, useRef, useState } from 'react'

const MUTE_KEY = 'voyage_music_muted'
const TARGET_VOLUME = 0.5

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export interface BackgroundMusic {
  /** false khi file nhạc không tồn tại / không phát được → nên ẩn nút nhạc */
  available: boolean
  playing: boolean
  muted: boolean
  /** Gọi trong sự kiện click/touch để vượt qua chặn tự phát của trình duyệt. */
  start: () => void
  toggle: () => void
  toggleMute: () => void
}

export function useBackgroundMusic(src: string): BackgroundMusic {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeRef = useRef<number | null>(null)
  const [available, setAvailable] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(readMuted)

  useEffect(() => {
    const audio = new Audio()
    audio.loop = true
    audio.preload = 'none'
    audio.volume = TARGET_VOLUME
    audio.muted = readMuted()
    audio.src = src
    audioRef.current = audio

    const onError = () => {
      setAvailable(false)
      setPlaying(false)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('error', onError)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      if (fadeRef.current) window.clearInterval(fadeRef.current)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
  }, [src])

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      audio.volume = 0
      await audio.play()
      if (fadeRef.current) window.clearInterval(fadeRef.current)
      fadeRef.current = window.setInterval(() => {
        const next = Math.min(TARGET_VOLUME, audio.volume + 0.05)
        audio.volume = next
        if (next >= TARGET_VOLUME && fadeRef.current) {
          window.clearInterval(fadeRef.current)
          fadeRef.current = null
        }
      }, 150)
    } catch {
      // Trình duyệt chặn hoặc file lỗi: lỗi file đã được xử lý ở sự kiện 'error'
      setPlaying(false)
    }
  }, [])

  const start = useCallback(() => {
    if (!audioRef.current || audioRef.current.paused === false) return
    void play()
  }, [play])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) void play()
    else audio.pause()
  }, [play])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    const next = !audio.muted
    audio.muted = next
    setMuted(next)
    try {
      localStorage.setItem(MUTE_KEY, next ? '1' : '0')
    } catch {
      // ignore
    }
  }, [])

  return { available, playing, muted, start, toggle, toggleMute }
}
