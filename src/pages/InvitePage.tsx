import { lazy, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGuest } from '../hooks/useGuest'
import { useEventConfig } from '../hooks/useEventConfig'
import { useBackgroundMusic } from '../hooks/useBackgroundMusic'
import SeagullIntro from '../components/scenes/SeagullIntro'
import MainInvitationScreen from '../components/scenes/MainInvitationScreen'
import OverlayModal from '../components/ui/OverlayModal'
import { ASSETS } from '../lib/assets'
import type { OverlayId } from '../components/ui/NavigationIcons'

const TreasureMap = lazy(() => import('../components/scenes/TreasureMap'))
const ClosingScene = lazy(() => import('../components/scenes/ClosingScene'))

function ModalFallback() {
  return (
    <div className="flex justify-center py-10" role="status" aria-label="Đang tải">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-treasure-gold border-t-transparent" />
    </div>
  )
}

export default function InvitePage() {
  const { guestName, personalMessage, loading } = useGuest()
  const config = useEventConfig()
  const music = useBackgroundMusic(config.musicUrl || ASSETS.music)
  const [searchParams] = useSearchParams()
  // ?open=1 → bỏ qua màn mở đầu (tiện để xem thử / chụp màn hình)
  const skipIntro = searchParams.get('open') === '1'
  const [introDone, setIntroDone] = useState(skipIntro)
  const [mainVisible, setMainVisible] = useState(skipIntro)
  const [introLeaving, setIntroLeaving] = useState(skipIntro)
  const [activeOverlay, setActiveOverlay] = useState<OverlayId | null>(null)

  // Tải trước ảnh nền trong lúc khách còn ở màn mở đầu
  useEffect(() => {
    const portrait = window.matchMedia?.('(max-aspect-ratio: 9/10)').matches
    for (const src of [portrait ? ASSETS.bgPortrait : ASSETS.bgLandscape, portrait ? ASSETS.seaPortrait : ASSETS.seaLandscape, ASSETS.sunny, ASSETS.bowFoam]) {
      new Image().src = src
    }
  }, [])

  const close = () => setActiveOverlay(null)

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-navy" role="status" aria-label="Đang tải thiệp">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-treasure-gold border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh">
      {!introDone && (
        <SeagullIntro
          guestName={guestName}
          graduateName={config.graduateName}
          onStart={() => {
            music.start()
            setIntroLeaving(true)
          }}
          onReveal={() => setMainVisible(true)}
          onDone={() => setIntroDone(true)}
        />
      )}
      {mainVisible && (
        <>
          <MainInvitationScreen
            guestName={guestName}
            personalMessage={personalMessage}
            music={music}
            onOpenOverlay={setActiveOverlay}
            overlayOpen={activeOverlay !== null || !introDone}
            revealed={introLeaving}
            textLag={skipIntro ? 0 : 0.9}
          />

          <OverlayModal isOpen={activeOverlay === 'map'} onClose={close} title="BẢN ĐỒ ĐỊA ĐIỂM" icon="🗺️" maxWidth="max-w-2xl">
            <Suspense fallback={<ModalFallback />}>
              <TreasureMap />
            </Suspense>
          </OverlayModal>

          <OverlayModal isOpen={activeOverlay === 'closing'} onClose={close} title="LỜI KẾT" icon="⚓" maxWidth="max-w-xl">
            <Suspense fallback={<ModalFallback />}>
              <ClosingScene graduateName={config.graduateName} portraitUrl={config.portraitUrl} onBack={close} />
            </Suspense>
          </OverlayModal>
        </>
      )}
    </div>
  )
}


