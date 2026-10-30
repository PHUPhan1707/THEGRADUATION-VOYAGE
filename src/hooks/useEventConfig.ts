import { useEffect, useState } from 'react'
import { fetchRemoteEventConfig } from '../lib/api'
import { getLocalEventConfig } from '../lib/storage'
import type { EventConfig } from '../types'

let remoteCache: EventConfig | null = null
let inflight: Promise<EventConfig | null> | null = null

function loadRemote(): Promise<EventConfig | null> {
  if (remoteCache) return Promise.resolve(remoteCache)
  if (!inflight) {
    inflight = fetchRemoteEventConfig().then((config) => {
      remoteCache = config
      inflight = null
      return config
    })
  }
  return inflight
}

/**
 * Cấu hình sự kiện dùng chung cho mọi màn hình.
 * Thứ tự ưu tiên: Supabase → localStorage (admin đã lưu) → mặc định trong config.ts.
 * Trả về giá trị đồng bộ ngay lập tức, rồi tự cập nhật khi tải xong từ Supabase.
 */
export function useEventConfig(): EventConfig {
  const [config, setConfig] = useState<EventConfig>(() => remoteCache ?? getLocalEventConfig())

  useEffect(() => {
    let active = true
    loadRemote().then((remote) => {
      if (active && remote) setConfig(remote)
    })
    return () => {
      active = false
    }
  }, [])

  return config
}
