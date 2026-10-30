/**
 * Link thiệp tự chứa dữ liệu: `/invite#<base64url(JSON)>`.
 * Không cần máy chủ – mở link là đọc được tên khách và lời nhắn ngay trên trình duyệt.
 * Phần sau dấu # không được gửi lên máy chủ và không bị Zalo/Messenger cắt ở khoảng trắng.
 */

export const MAX_NAME_LENGTH = 60
export const MAX_MESSAGE_LENGTH = 300

export interface InvitePayload {
  name: string
  message?: string
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)))
}

const clean = (raw: unknown, max: number) =>
  typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, max) : ''

export function encodeInvite({ name, message }: InvitePayload): string {
  const payload: Record<string, unknown> = { v: 1, name: clean(name, MAX_NAME_LENGTH) }
  const msg = clean(message, MAX_MESSAGE_LENGTH)
  if (msg) payload.message = msg
  return toBase64Url(JSON.stringify(payload))
}

/** Trả về null nếu mã hỏng hoặc không có tên */
export function decodeInvite(code: string): InvitePayload | null {
  const raw = code.replace(/^#/, '').trim()
  if (!raw) return null
  try {
    const data = JSON.parse(fromBase64Url(raw)) as Record<string, unknown>
    const name = clean(data.name, MAX_NAME_LENGTH)
    if (!name) return null
    const message = clean(data.message, MAX_MESSAGE_LENGTH)
    return message ? { name, message } : { name }
  } catch {
    return null
  }
}

export function buildInviteUrl(payload: InvitePayload, origin: string = window.location.origin): string {
  return `${origin}/invite#${encodeInvite(payload)}`
}
