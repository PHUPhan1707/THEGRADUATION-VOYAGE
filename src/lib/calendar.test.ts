import { describe, expect, it } from 'vitest'
import { buildGoogleCalendarUrl, buildIcs, getCalendarRange } from './calendar'

const base = { title: 'Lễ tốt nghiệp', date: '2026-11-28', location: 'Nhà điều hành Sinh viên' }

describe('calendar', () => {
  it('uses an all-day range when no time is set', () => {
    expect(getCalendarRange(base)).toEqual({ start: '20261128', end: '20261129', allDay: true })
  })

  it('builds a timed range with a 3 hour default duration', () => {
    expect(getCalendarRange({ ...base, time: '08:30' })).toEqual({
      start: '20261128T083000',
      end: '20261128T113000',
      allDay: false,
    })
  })

  it('rolls over to the next day for late events', () => {
    expect(getCalendarRange({ ...base, time: '22:00' }).end).toBe('20261129T010000')
  })

  it('produces a valid ICS document with escaped text', () => {
    const ics = buildIcs({ ...base, description: 'a, b; c' }, new Date('2026-10-29T00:00:00Z'))
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('DTSTART;VALUE=DATE:20261128')
    expect(ics).toContain('DESCRIPTION:a\\, b\\; c')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('creates a Google Calendar link', () => {
    const url = buildGoogleCalendarUrl({ ...base, time: '08:00' })
    expect(url).toContain('calendar.google.com')
    expect(url).toContain('dates=20261128T080000%2F20261128T110000')
  })
})
