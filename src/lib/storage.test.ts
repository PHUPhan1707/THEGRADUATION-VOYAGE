// Runtime validation coverage for local event configuration and guest storage.
import { beforeEach, describe, expect, it } from 'vitest'
import { getLocalEventConfig, getLocalGuests, saveLocalGuests, updateLocalGuest } from './storage'

const values = new Map<string, string>()

beforeEach(() => {
  values.clear()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
})

describe('local storage fallback', () => {
  it('provides a usable default event configuration', () => {
    expect(getLocalEventConfig()).toMatchObject({
      graduateName: 'Phan An Phú',
      graduationDate: '2026-11-28',
      venue: 'Nhà điều hành Sinh viên',
    })
  })

  it('updates a locally stored guest RSVP', () => {
    saveLocalGuests([{
      id: 'guest-1',
      name: 'Nguyễn Văn A',
      category: 'friend',
      inviteId: 'abc12345',
      rsvpStatus: 'pending',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      revoked: false,
    }])

    const updated = updateLocalGuest('guest-1', {
      rsvpStatus: 'attending',
      rsvpMessage: 'Mình sẽ đến!',
    })

    expect(updated?.rsvpStatus).toBe('attending')
    expect(getLocalGuests()[0].rsvpMessage).toBe('Mình sẽ đến!')
  })
})
