import { useEffect, useState, type CSSProperties } from 'react'
import { ASSETS } from '../../lib/assets'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import ShipIllustration from './ShipIllustration'

type Status = 'loading' | 'ok' | 'missing'

function usePreload(src: string): Status {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    let active = true
    const img = new Image()
    img.onload = () => active && setStatus('ok')
    img.onerror = () => active && setStatus('missing')
    img.src = src
    return () => {
      active = false
    }
  }, [src])

  return status
}

function Cloud({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 220 90" className={className} style={style} fill="#fff">
      <ellipse cx="62" cy="58" rx="54" ry="26" />
      <ellipse cx="115" cy="42" rx="46" ry="32" />
      <ellipse cx="164" cy="60" rx="46" ry="24" />
      <rect x="20" y="58" width="190" height="24" rx="12" />
    </svg>
  )
}

function Bird({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 16" className={className} style={style} fill="none" stroke="#1d3b5a" strokeWidth="2.2" strokeLinecap="round">
      <path d="M2 10 Q10 0 20 10 Q30 0 38 10" />
    </svg>
  )
}

/** Bầu trời + biển + con tàu dựng bằng CSS/SVG, dùng khi chưa có ảnh nền thật. */
function FallbackScene({ showShip }: { showShip: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Trời → biển */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #2f86cf 0%, #5eaee6 26%, #9fd6f4 50%, #d6f0fc 63%, #3a8fcc 66%, #1f6aa6 82%, #143f66 100%)',
        }}
      />

      {/* Mặt trời + tia sáng */}
      <div className="absolute left-1/2 top-[30%] h-0 w-0">
        <div
          className="absolute left-0 top-0 h-[170vmax] w-[170vmax] opacity-[0.22]"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.9) 0deg 5deg, transparent 5deg 18deg)',
            WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 38%)',
            maskImage: 'radial-gradient(circle, #000 0%, transparent 38%)',
            animation: 'rays-spin 140s linear infinite',
          }}
        />
        <div
          className="absolute left-0 top-0 h-[34vmin] w-[34vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: 'radial-gradient(circle, #fffbe6 0%, rgba(255,240,170,0.85) 30%, rgba(255,224,140,0) 70%)',
          }}
        />
      </div>

      {/* Mây */}
      <Cloud className="animate-drift absolute left-0 top-[9%] w-40 opacity-90 sm:w-56" style={{ animationDuration: '70s' }} />
      <Cloud
        className="animate-drift absolute left-0 top-[27%] w-28 opacity-80 sm:w-44"
        style={{ animationDuration: '95s', animationDelay: '-40s' }}
      />
      <Cloud
        className="animate-drift absolute left-0 top-[44%] w-32 opacity-70 sm:w-48"
        style={{ animationDuration: '110s', animationDelay: '-75s' }}
      />

      {/* Chim biển */}
      <Bird className="animate-float-slow absolute left-[14%] top-[22%] w-8 sm:w-10" />
      <Bird className="animate-float absolute left-[20%] top-[26%] w-5 sm:w-7" />
      <Bird className="animate-float-slow absolute right-[16%] top-[20%] w-7 sm:w-9" style={{ animationDelay: '-2s' }} />

      {/* Con tàu: nằm giữa – đúng vị trí nhân vật sẽ đứng khi có ảnh nền thật */}
      {showShip && (
        <div className="animate-fade-in absolute inset-x-0 bottom-[16%] h-[min(40dvh,520px)] sm:bottom-[12%] sm:h-[min(44dvh,560px)]">
          <ShipIllustration className="h-full w-full drop-shadow-[0_14px_22px_rgba(0,0,0,0.35)]" />
        </div>
      )}

      {/* Sóng (vẽ sau con tàu để che phần đáy thân tàu) */}
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="animate-wave absolute bottom-[12%] h-28 w-[200%] opacity-40"
      >
        <path fill="#1a5f94" d="M0,80 C240,20 480,140 720,80 C960,20 1200,140 1440,80 L1440,200 L0,200 Z" />
      </svg>
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="animate-wave absolute bottom-0 h-28 w-[200%] opacity-60"
        style={{ animationDuration: '11s' }}
      >
        <path fill="#143f66" d="M0,90 C200,150 500,30 720,90 C940,150 1240,30 1440,90 L1440,200 L0,200 Z" />
      </svg>
    </div>
  )
}

const SPRAY_DROPS = [
  { left: '6%', size: 10, delay: '0s', dx: '-46px', dy: '-90px' },
  { left: '12%', size: 7, delay: '-0.5s', dx: '-30px', dy: '-120px' },
  { left: '18%', size: 12, delay: '-1.1s', dx: '-56px', dy: '-70px' },
  { left: '9%', size: 6, delay: '-1.6s', dx: '-20px', dy: '-140px' },
  { left: '22%', size: 8, delay: '-2.1s', dx: '-38px', dy: '-100px' },
  { left: '15%', size: 5, delay: '-0.8s', dx: '-64px', dy: '-60px' },
]

/** Con tàu Thousand Sunny tách lớp: nhấp nhô trên sóng, bọt nước đẩy ở mũi + vệt sóng phía sau */
function SailingSunny({ isPortrait, entered }: { isPortrait: boolean; entered: boolean }) {
  const box: CSSProperties = isPortrait
    ? { left: '50%', bottom: '27%', height: '45%', aspectRatio: '640 / 731' }
    : { left: '64%', bottom: '11%', height: '84%', aspectRatio: '640 / 731' }

  return (
    <div className="absolute -translate-x-1/2" style={box}>
      {/* Xuất hiện: trồi lên từ mặt nước */}
      <div className={`sunny-enter absolute inset-0 ${entered ? 'is-entered' : ''}`}>
        <div className="sunny-glow absolute" />
        {/* Vệt sóng phía sau đuôi tàu */}
        <img src={ASSETS.bowFoam} alt="" draggable={false} className="sunny-wake absolute" />
        <img src={ASSETS.bowFoam} alt="" draggable={false} className="sunny-wake absolute" style={{ animationDelay: '-2.2s' }} />

        <div className="sunny-sail absolute inset-0">
          <img
            src={ASSETS.sunny}
            alt=""
            draggable={false}
            className="sunny-hull absolute inset-0 h-full w-full object-contain"
          />
        </div>

        {/* Bọt nước bị mũi tàu đẩy lên */}
        <img src={ASSETS.bowFoam} alt="" draggable={false} className="sunny-foam absolute" />
        <img
          src={ASSETS.bowFoam}
          alt=""
          draggable={false}
          className="sunny-foam sunny-foam-back absolute"
          style={{ animationDelay: '-1.4s' }}
        />
        {SPRAY_DROPS.map((d, i) => (
          <span
            key={i}
            className="sunny-spray absolute rounded-full bg-white"
            style={
              {
                left: d.left,
                bottom: '9%',
                width: d.size,
                height: d.size,
                animationDelay: d.delay,
                '--dx': d.dx,
                '--dy': d.dy,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Nền của màn hình đầu (đặt trong phần tử `relative`). Tự chọn ảnh dọc (điện thoại)
 * hoặc ngang (máy tính); nếu ảnh chưa có thì dùng cảnh dựng bằng code.
 * Có ảnh tách lớp (biển trống + con tàu) thì dựng cảnh tàu chuyển động.
 */
export default function SceneBackground({ entered = true }: { entered?: boolean }) {
  const isPortrait = useMediaQuery('(max-aspect-ratio: 9/10)')
  const landscape = usePreload(ASSETS.bgLandscape)
  const portrait = usePreload(ASSETS.bgPortrait)
  const sea = usePreload(isPortrait ? ASSETS.seaPortrait : ASSETS.seaLandscape)
  const ship = usePreload(ASSETS.sunny)
  const animated = sea === 'ok' && ship === 'ok'

  const preferred = isPortrait ? portrait : landscape
  const preferredSrc = isPortrait ? ASSETS.bgPortrait : ASSETS.bgLandscape
  const otherStatus = isPortrait ? landscape : portrait
  const otherSrc = isPortrait ? ASSETS.bgLandscape : ASSETS.bgPortrait

  let src: string | null = null
  if (preferred === 'ok') src = preferredSrc
  else if (preferred === 'missing' && otherStatus === 'ok') src = otherSrc

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <FallbackScene showShip={!src && landscape !== 'loading' && portrait !== 'loading'} />
      {src && !animated && (
        <div className="animate-ken-burns absolute inset-0">
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            className="animate-fade-in absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: isPortrait ? '50% 50%' : '55% 45%' }}
          />
        </div>
      )}
      {animated && (
        <div className="animate-fade-in absolute inset-0">
          <div className="animate-ken-burns absolute inset-0">
            <img
              src={isPortrait ? ASSETS.seaPortrait : ASSETS.seaLandscape}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: isPortrait ? '50% 50%' : '55% 45%' }}
            />
          </div>
          <SailingSunny isPortrait={isPortrait} entered={entered} />
        </div>
      )}
      {(src || animated) && <div className="light-sweep absolute inset-y-0 left-0 w-1/3" />}
    </div>
  )
}



