import { useState, useEffect } from 'react'
import { useSearchParams, useParams, useLocation } from 'react-router-dom'
import { fetchGuestByInvite } from '../lib/api'
import { decodeInvite, MAX_NAME_LENGTH } from '../lib/inviteLink'
import { getLocalGuests } from '../lib/storage'
import type { Guest } from '../types'

interface GuestData {
  guestName: string
  personalMessage?: string
  guest: Guest | null
  loading: boolean
}

const DEFAULT_NAME = 'Lê Giang Thanh Thủy'
/** Làm sạch tên lấy từ URL (?to=...) – React đã tự escape HTML, ở đây chỉ giới hạn độ dài. */
function sanitizeName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH)
  return name || DEFAULT_NAME
}

export function useGuest(): GuestData {
  const [searchParams] = useSearchParams()
  const { inviteId } = useParams()
  const { hash } = useLocation()
  const toParam = searchParams.get('to')
  const [guestData, setGuestData] = useState<GuestData>({
    guestName: '',
    personalMessage: undefined,
    guest: null,
    loading: true,
  })

  useEffect(() => {
    let active = true

    async function resolveGuest(): Promise<GuestData> {
      if (inviteId) {
        const remote = await fetchGuestByInvite(inviteId)
        if (remote) {
          return {
            guestName: remote.name,
            personalMessage: remote.personalMessage,
            guest: remote,
            loading: false,
          }
        }

        const local = getLocalGuests().find((item) => item.inviteId === inviteId && !item.revoked)
        if (local) {
          return {
            guestName: local.name,
            personalMessage: local.personalMessage,
            guest: local,
            loading: false,
          }
        }
      }

      const fromHash = decodeInvite(hash)
      if (fromHash) {
        return { guestName: fromHash.name, personalMessage: fromHash.message, guest: null, loading: false }
      }

      if (toParam) {
        return { guestName: sanitizeName(toParam), guest: null, loading: false }
      }

      return { guestName: DEFAULT_NAME, guest: null, loading: false }
    }

    resolveGuest().then((data) => {
      if (active) setGuestData(data)
    })

    return () => {
      active = false
    }
  }, [toParam, inviteId, hash])

  return guestData
}
