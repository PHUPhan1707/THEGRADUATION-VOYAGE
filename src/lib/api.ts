import { supabase } from './supabase'
import { isSupabaseConfigured } from './storage'
import type { EventConfig, Guest } from '../types'

/* ───────────────────────── Mapping (camelCase <-> snake_case) ───────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

export function rowToGuest(row: Row): Guest {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? 'friend',
    personalMessage: row.personal_message ?? row.personalMessage ?? undefined,
    inviteId: row.invite_id ?? row.inviteId,
    rsvpStatus: row.rsvp_status ?? row.rsvpStatus ?? 'pending',
    rsvpMessage: row.rsvp_message ?? row.rsvpMessage ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
    revoked: Boolean(row.revoked),
  }
}

export function guestToRow(guest: Guest): Row {
  return {
    id: guest.id,
    name: guest.name,
    category: guest.category,
    personal_message: guest.personalMessage ?? null,
    invite_id: guest.inviteId,
    rsvp_status: guest.rsvpStatus,
    rsvp_message: guest.rsvpMessage ?? null,
    created_at: guest.createdAt,
    updated_at: guest.updatedAt,
    revoked: guest.revoked,
  }
}

export function rowToEventConfig(row: Row): EventConfig {
  return {
    id: row.id ?? 'main',
    graduateName: row.graduate_name,
    university: row.university,
    graduationDate: row.graduation_date,
    ceremonyTime: row.ceremony_time ? String(row.ceremony_time).slice(0, 5) : null,
    venue: row.venue,
    mapsLink: row.maps_link ?? null,
    portraitUrl: row.portrait_url ?? null,
    ogImageUrl: row.og_image_url ?? null,
    musicUrl: row.music_url ?? null,
    updatedAt: row.updated_at ?? new Date().toISOString(),
  }
}

export function eventConfigToRow(config: EventConfig): Row {
  return {
    id: 'main',
    graduate_name: config.graduateName,
    university: config.university,
    graduation_date: config.graduationDate,
    ceremony_time: config.ceremonyTime || null,
    venue: config.venue,
    maps_link: config.mapsLink || null,
    portrait_url: config.portraitUrl || null,
    og_image_url: config.ogImageUrl || null,
    music_url: config.musicUrl || null,
    updated_at: new Date().toISOString(),
  }
}

/* ───────────────────────── Cấu hình sự kiện ───────────────────────── */

/** Lấy cấu hình từ Supabase. Trả về null nếu chưa cấu hình / chưa có dữ liệu / lỗi mạng. */
export async function fetchRemoteEventConfig(): Promise<EventConfig | null> {
  if (!isSupabaseConfigured() || !supabase) return null
  try {
    const { data, error } = await supabase.from('event_config').select('*').eq('id', 'main').maybeSingle()
    if (error || !data) return null
    return rowToEventConfig(data)
  } catch {
    return null
  }
}

export async function saveRemoteEventConfig(config: EventConfig): Promise<void> {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')
  const { error } = await supabase.from('event_config').upsert(eventConfigToRow(config))
  if (error) throw new Error(error.message)
}

/* ───────────────────────── Khách mời (admin) ───────────────────────── */

export async function fetchRemoteGuests(): Promise<Guest[] | null> {
  if (!isSupabaseConfigured() || !supabase) return null
  try {
    const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false })
    if (error || !data) return null
    return data.map(rowToGuest)
  } catch {
    return null
  }
}

export async function upsertRemoteGuest(guest: Guest): Promise<void> {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')
  const { error } = await supabase.from('guests').upsert(guestToRow(guest))
  if (error) throw new Error(error.message)
}

export async function deleteRemoteGuest(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')
  const { error } = await supabase.from('guests').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/* ───────────────────────── Khách mời (công khai, qua RPC) ───────────────────────── */

/** Khách truy cập chỉ lấy được đúng 1 dòng theo invite_id (hàm `get_guest_by_invite`). */
export async function fetchGuestByInvite(inviteId: string): Promise<Guest | null> {
  if (!isSupabaseConfigured() || !supabase) return null
  try {
    const { data, error } = await supabase.rpc('get_guest_by_invite', { p_invite_id: inviteId })
    if (error || !data) return null
    const row = Array.isArray(data) ? data[0] : data
    return row ? rowToGuest(row) : null
  } catch {
    return null
  }
}

export async function submitRemoteRsvp(
  inviteId: string,
  status: 'attending' | 'declined',
  message: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase chưa được cấu hình')
  const { data, error } = await supabase.rpc('submit_rsvp', {
    p_invite_id: inviteId,
    p_status: status,
    p_message: message,
  })
  if (error) throw new Error(error.message)
  if (data === false) throw new Error('Lời mời không hợp lệ hoặc đã bị thu hồi')
}
