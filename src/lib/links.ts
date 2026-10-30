import type { Guest } from '../types'
import { isSupabaseConfigured } from './storage'

/**
 * Đường dẫn thiệp của một khách.
 * - Có Supabase: dùng `/invite/:inviteId` (lưu được RSVP, bảo mật vì mã ngẫu nhiên).
 * - Không có Supabase: dùng `/invite?to=Tên` (chạy được trên mọi thiết bị, không lưu RSVP tập trung).
 */
export function getGuestPath(guest: Pick<Guest, 'inviteId' | 'name'>, useInviteId = isSupabaseConfigured()): string {
  return useInviteId
    ? `/invite/${guest.inviteId}`
    : `/invite?to=${encodeURIComponent(guest.name)}`
}

export function getGuestUrl(
  guest: Pick<Guest, 'inviteId' | 'name'>,
  origin: string = window.location.origin,
  useInviteId = isSupabaseConfigured(),
): string {
  return `${origin}${getGuestPath(guest, useInviteId)}`
}
