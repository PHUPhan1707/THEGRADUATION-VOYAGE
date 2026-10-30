export interface CalendarEvent {
  title: string
  /** YYYY-MM-DD */
  date: string
  /** HH:mm (24h) hoặc rỗng nếu chưa có giờ → sự kiện cả ngày */
  time?: string | null
  location?: string
  description?: string
  /** Thời lượng (phút) khi có giờ. Mặc định 3 giờ */
  durationMinutes?: number
}

const pad = (n: number) => String(n).padStart(2, '0')

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`
}

/** Trả về cặp [start, end] theo định dạng lịch, giờ địa phương (Asia/Ho_Chi_Minh). */
export function getCalendarRange(event: CalendarEvent): { start: string; end: string; allDay: boolean } {
  const compactDate = event.date.replace(/-/g, '')
  if (!event.time) {
    return { start: compactDate, end: addDays(event.date, 1), allDay: true }
  }
  const [h, min] = event.time.split(':').map(Number)
  const total = h * 60 + min + (event.durationMinutes ?? 180)
  const dayShift = Math.floor(total / (24 * 60))
  const endMinutes = total % (24 * 60)
  const endDate = dayShift ? addDays(event.date, dayShift) : compactDate
  return {
    start: `${compactDate}T${pad(h)}${pad(min)}00`,
    end: `${endDate}T${pad(Math.floor(endMinutes / 60))}${pad(endMinutes % 60)}00`,
    allDay: false,
  }
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const { start, end, allDay } = getCalendarRange(event)
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const dtLines = allDay
    ? [`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`]
    : [`DTSTART;TZID=Asia/Ho_Chi_Minh:${start}`, `DTEND;TZID=Asia/Ho_Chi_Minh:${end}`]

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Graduation Voyage//VI',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:graduation-${start}@graduation-voyage`,
    `DTSTAMP:${stamp}`,
    ...dtLines,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.location ? `LOCATION:${escapeIcs(event.location)}` : '',
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = getCalendarRange(event)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    ctz: 'Asia/Ho_Chi_Minh',
  })
  if (event.location) params.set('location', event.location)
  if (event.description) params.set('details', event.description)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function downloadIcs(event: CalendarEvent, filename = 'le-tot-nghiep.ics'): void {
  const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
