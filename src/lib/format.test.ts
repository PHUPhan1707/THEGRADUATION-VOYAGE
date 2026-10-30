import { describe, expect, it } from 'vitest'
import { fillTemplate, formatCeremonyTime, formatDateDots, formatDateSlash, weekdayVi } from './format'

describe('format helpers', () => {
  it('formats dates', () => {
    expect(formatDateDots('2026-11-28')).toBe('28.11.2026')
    expect(formatDateSlash('2026-11-28')).toBe('28/11/2026')
  })

  it('finds the weekday (28/11/2026 is a Saturday)', () => {
    expect(weekdayVi('2026-11-28')).toBe('Thứ Bảy')
  })

  it('falls back when the ceremony time is unknown', () => {
    expect(formatCeremonyTime('08:00')).toBe('08:00')
    expect(formatCeremonyTime(null)).toBe('Sẽ thông báo sớm')
  })

  it('fills template placeholders', () => {
    expect(fillTemplate('Ngày {date} tại {university}', { date: '28/11/2026', university: 'IU' })).toBe(
      'Ngày 28/11/2026 tại IU',
    )
  })
})
