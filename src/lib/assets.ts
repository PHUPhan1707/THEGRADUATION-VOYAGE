/**
 * Đường dẫn tới ảnh / âm thanh. Người dùng chỉ cần đặt file đúng tên vào thư mục `public/`
 * (xem CHUAN_BI_ANH.md). File thiếu sẽ được xử lý bằng fallback.
 */
export const ASSETS = {
  bgLandscape: '/images/main/bg-landscape.jpg',
  bgPortrait: '/images/main/bg-portrait.jpg',
  /** Cảnh tách lớp cho tàu chuyển động: biển trống + tàu + bọt sóng (PNG trong suốt) */
  seaLandscape: '/images/main/sea-landscape.jpg',
  seaPortrait: '/images/main/sea-portrait.jpg',
  sunny: '/images/main/sunny.png',
  bowFoam: '/images/main/bow-foam.png',
  cabinWall: '/images/main/cabin-wall.jpg',
  ogImage: '/images/share/og-image.jpg',
  music: '/audio/bgm.mp3',
  galleryManifest: '/images/gallery/gallery.json',
  galleryDir: '/images/gallery/',
  galleryFallback: '/images/gallery-sample.jpg',
  closingBg: ['/images/closing/closing-bg.jpg', '/images/sunset-ship.jpg'],
  venueMap: ['/images/map/venue-map.jpg', '/images/treasure-island-map.jpg'],
  graduatePortrait: '/images/portrait/graduate.png',
  letterPaper: '/images/letter/parchment.jpg',
  wantedPhoto: '/images/portrait/wanted-photo.jpg',
  treasureMap: '/images/explore/treasure-map.jpg',
} as const


