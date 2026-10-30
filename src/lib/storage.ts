import type { EventConfig, GalleryPhoto, Guest } from '../types'
import { SITE_CONFIG } from './config'

export const STORAGE_KEYS = {
  guests: 'voyage_guests',
  eventConfig: 'voyage_event_config',
  gallery: 'voyage_gallery',
  adminSession: 'voyage_admin_session',
} as const

export function isSupabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getLocalGuests(): Guest[] {
  return readJson<Guest[]>(STORAGE_KEYS.guests, [])
}

export function saveLocalGuests(guests: Guest[]): void {
  writeJson(STORAGE_KEYS.guests, guests)
}

/** Cấu hình mặc định lấy từ `config.ts` (dùng khi chưa lưu gì trong admin / Supabase). */
export function getDefaultEventConfig(): EventConfig {
  return {
    id: 'main',
    graduateName: SITE_CONFIG.graduateName,
    university: SITE_CONFIG.university,
    graduationDate: SITE_CONFIG.graduationDate,
    ceremonyTime: SITE_CONFIG.ceremonyTime || null,
    venue: SITE_CONFIG.venue,
    mapsLink: SITE_CONFIG.mapsLink,
    portraitUrl: null,
    ogImageUrl: null,
    musicUrl: null,
    updatedAt: new Date(0).toISOString(),
  }
}

export function getLocalEventConfig(): EventConfig {
  const defaults = getDefaultEventConfig()
  const stored = readJson<Partial<EventConfig> | null>(STORAGE_KEYS.eventConfig, null)
  return stored ? { ...defaults, ...stored } : defaults
}

export function hasLocalEventConfig(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEYS.eventConfig))
  } catch {
    return false
  }
}

export function saveLocalEventConfig(config: EventConfig): void {
  writeJson(STORAGE_KEYS.eventConfig, config)
}

export function getLocalPhotos(): GalleryPhoto[] {
  return readJson<GalleryPhoto[]>(STORAGE_KEYS.gallery, [])
}

export function saveLocalPhotos(photos: GalleryPhoto[]): void {
  writeJson(STORAGE_KEYS.gallery, photos)
}

export function updateLocalGuest(id: string, updates: Partial<Guest>): Guest | null {
  const guests = getLocalGuests()
  const index = guests.findIndex((guest) => guest.id === id)
  if (index < 0) return null

  const updated = {
    ...guests[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  guests[index] = updated
  saveLocalGuests(guests)
  return updated
}
