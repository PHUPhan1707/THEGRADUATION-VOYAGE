import { describe, expect, it } from 'vitest'
import { buildInviteUrl, decodeInvite, encodeInvite } from './inviteLink'

describe('inviteLink', () => {
  it('mã hoá rồi giải mã lại đúng tên tiếng Việt và lời nhắn', () => {
    const code = encodeInvite({ name: 'Lê Giang Thanh Thủy', message: 'Nhớ tới sớm nha!' })
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeInvite(code)).toEqual({ name: 'Lê Giang Thanh Thủy', message: 'Nhớ tới sớm nha!' })
  })

  it('bỏ qua mã hỏng hoặc thiếu tên', () => {
    expect(decodeInvite('')).toBeNull()
    expect(decodeInvite('%%%')).toBeNull()
    expect(decodeInvite(encodeInvite({ name: '   ' }))).toBeNull()
  })

  it('tạo link dạng /invite#...', () => {
    const url = buildInviteUrl({ name: 'Phú' }, 'https://thiep.example.com')
    expect(url.startsWith('https://thiep.example.com/invite#')).toBe(true)
    expect(decodeInvite(url.split('#')[1])).toEqual({ name: 'Phú' })
  })
})
