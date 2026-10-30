import { describe, expect, it } from 'vitest'
import { getGuestPath, getGuestUrl } from './links'

const guest = { inviteId: 'Ab3dEf9k', name: 'Nguyễn Văn A' }

describe('guest links', () => {
  it('uses the invite id when a shared backend exists', () => {
    expect(getGuestPath(guest, true)).toBe('/invite/Ab3dEf9k')
  })

  it('falls back to a name query without a backend', () => {
    expect(getGuestPath(guest, false)).toBe('/invite?to=Nguy%E1%BB%85n%20V%C4%83n%20A')
  })

  it('builds absolute URLs', () => {
    expect(getGuestUrl(guest, 'https://example.com', true)).toBe('https://example.com/invite/Ab3dEf9k')
  })
})
