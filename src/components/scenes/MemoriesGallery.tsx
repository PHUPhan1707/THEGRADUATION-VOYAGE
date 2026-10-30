import { useEffect, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'motion/react'
import { ASSETS } from '../../lib/assets'
import { getLocalPhotos } from '../../lib/storage'

interface Photo {
  id: string
  url: string
  caption: string
}

interface ManifestEntry {
  file: string
  caption?: string
}

const SWIPE_THRESHOLD = 60

function canLoad(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

/** Đọc `public/images/gallery/gallery.json`, chỉ giữ ảnh thật sự tồn tại. */
async function loadManifestPhotos(): Promise<Photo[]> {
  try {
    const res = await fetch(ASSETS.galleryManifest, { cache: 'no-cache' })
    if (!res.ok) return []
    const entries: unknown = await res.json()
    if (!Array.isArray(entries)) return []

    const candidates = (entries as ManifestEntry[])
      .filter((entry) => entry && typeof entry.file === 'string')
      .map((entry, index) => ({
        id: `gallery-${index}`,
        url: `${ASSETS.galleryDir}${entry.file}`,
        caption: entry.caption ?? '',
      }))

    const results = await Promise.all(candidates.map((photo) => canLoad(photo.url)))
    return candidates.filter((_, index) => results[index])
  } catch {
    // Không có manifest (hoặc server trả về HTML) → coi như chưa có ảnh
    return []
  }
}

async function loadPhotos(): Promise<Photo[]> {
  const fromFolder = await loadManifestPhotos()
  if (fromFolder.length > 0) return fromFolder

  const fromAdmin = getLocalPhotos()
  if (fromAdmin.length > 0) {
    return [...fromAdmin]
      .sort((a, b) => a.order - b.order)
      .map((photo) => ({ id: photo.id, url: photo.url, caption: photo.caption ?? '' }))
  }

  return [
    {
      id: 'sample',
      url: ASSETS.galleryFallback,
      caption: 'Những khoảnh khắc thanh xuân rực rỡ tại giảng đường Đại học Quốc tế',
    },
  ]
}

export default function MemoriesGallery() {
  const [photos, setPhotos] = useState<Photo[] | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    let active = true
    loadPhotos().then((result) => active && setPhotos(result))
    return () => {
      active = false
    }
  }, [])

  if (!photos) {
    return (
      <div className="flex justify-center py-12" role="status" aria-label="Đang tải ảnh">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-treasure-gold border-t-transparent" />
      </div>
    )
  }

  const total = photos.length
  const activePhoto = photos[Math.min(currentIndex, total - 1)]
  const go = (delta: number) => {
    if (total <= 1) return
    setCurrentIndex((prev) => (prev + delta + total) % total)
  }
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) go(1)
    else if (info.offset.x > SWIPE_THRESHOLD) go(-1)
  }

  return (
    <div className="w-full space-y-4 text-navy">
      <p className="text-center text-sm italic text-navy/70">
        “Thanh xuân như một chuyến hải trình rực rỡ, mỗi khoảnh khắc đều là một viên ngọc quý.”
      </p>

      <div className="relative mx-auto max-w-lg">
        <div className="relative rounded-xl border-2 border-treasure-gold/30 bg-white p-3 pb-5 shadow-xl">
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-navy/10">
            <AnimatePresence mode="wait">
              <motion.img
                key={activePhoto.id}
                src={activePhoto.url}
                alt={activePhoto.caption || `Ảnh kỷ niệm ${currentIndex + 1}`}
                className="h-full w-full touch-pan-y select-none object-cover"
                draggable={false}
                drag={total > 1 ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={handleDragEnd}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.25 }}
              />
            </AnimatePresence>

            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-2.5 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-treasure-gold/40 bg-navy/70 text-xl font-bold text-treasure-gold shadow-md transition-all hover:scale-110 hover:bg-navy active:scale-95"
                  aria-label="Ảnh trước"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-2.5 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-treasure-gold/40 bg-navy/70 text-xl font-bold text-treasure-gold shadow-md transition-all hover:scale-110 hover:bg-navy active:scale-95"
                  aria-label="Ảnh tiếp"
                >
                  ›
                </button>
              </>
            )}
          </div>

          <div className="px-2 pt-3 text-center">
            <p className="font-handwriting text-xl italic text-navy/85">
              {activePhoto.caption || 'Kỷ niệm thời đại học'}
            </p>
            {total > 1 && (
              <p className="mt-1 text-xs text-navy/50" aria-live="polite">
                {Math.min(currentIndex, total - 1) + 1} / {total}
              </p>
            )}
          </div>
        </div>

        {total > 1 && (
          <div className="flex items-center justify-center gap-2 pt-3">
            {photos.map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 cursor-pointer rounded-full transition-all ${
                  currentIndex === idx ? 'w-6 bg-treasure-gold' : 'w-2.5 bg-treasure-gold/30 hover:bg-treasure-gold/60'
                }`}
                aria-label={`Chuyển đến ảnh ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {total > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 sm:justify-center">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-11 w-14 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-all ${
                currentIndex === idx
                  ? 'scale-105 border-treasure-gold shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-label={`Xem ảnh ${idx + 1}`}
            >
              <img src={photo.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
