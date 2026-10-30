import { useState, type ReactNode } from 'react'

interface FallbackImageProps {
  /** Danh sách ảnh theo thứ tự ưu tiên; ảnh lỗi/thiếu sẽ chuyển sang ảnh kế tiếp */
  sources: readonly string[]
  alt: string
  className?: string
  /** Hiện khi tất cả ảnh đều không có */
  empty?: ReactNode
  loading?: 'lazy' | 'eager'
}

export default function FallbackImage({ sources, alt, className, empty = null, loading = 'lazy' }: FallbackImageProps) {
  const [index, setIndex] = useState(0)
  if (index >= sources.length) return <>{empty}</>
  return (
    <img
      key={sources[index]}
      src={sources[index]}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setIndex((i) => i + 1)}
    />
  )
}
