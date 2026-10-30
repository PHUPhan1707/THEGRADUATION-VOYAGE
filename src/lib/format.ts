import { SITE_CONFIG } from './config'

/** '2026-11-28' → { day:'28', month:'11', year:'2026' } */
function parts(date: string) {
  const [year, month, day] = date.split('-')
  return { year, month, day }
}

/** '2026-11-28' → '28.11.2026' */
export function formatDateDots(date: string): string {
  const { day, month, year } = parts(date)
  return `${day}.${month}.${year}`
}

/** '2026-11-28' → '28/11/2026' */
export function formatDateSlash(date: string): string {
  const { day, month, year } = parts(date)
  return `${day}/${month}/${year}`
}

/** '2026-11-28' → 'Thứ Bảy' */
export function weekdayVi(date: string): string {
  const names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const { year, month, day } = parts(date)
  return names[new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay()]
}

/** '08:00' → '08:00'; null → 'Sẽ thông báo sớm' */
export function formatCeremonyTime(time: string | null | undefined): string {
  return time ? time : SITE_CONFIG.timeTbd
}

/** Thay {date} {university} {graduate} trong đoạn văn mẫu. */
export function fillTemplate(
  text: string,
  values: { date: string; university: string; graduate?: string },
): string {
  return text
    .split('{date}')
    .join(values.date)
    .split('{university}')
    .join(values.university)
    .split('{graduate}')
    .join(values.graduate ?? '')
}
