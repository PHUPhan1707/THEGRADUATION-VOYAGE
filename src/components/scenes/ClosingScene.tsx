import { motion, type Variants } from 'motion/react'
import FallbackImage from '../ui/FallbackImage'
import { StampIn, TORN_EDGE } from '../ui/InkDecor'
import { ASSETS } from '../../lib/assets'
interface ClosingSceneProps {
  graduateName: string
  portraitUrl?: string | null
  onBack?: () => void
}

const LINES = [
  'Mỗi chuyến hải trình đều có những người đồng hành đáng quý.',
  'Cảm ơn vì đã trở thành một phần trong hành trình thanh xuân của mình.',
  'Hành trình đại học khép lại, nhưng chuyến phiêu lưu của chúng ta vẫn còn tiếp tục.',
]

const letter: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.22, delayChildren: 0.7 } } }
const line: Variants = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function ClosingScene({ graduateName, onBack }: ClosingSceneProps) {
  return (
    <div className="w-full">
      {/* Tranh hoàng hôn: tàu Sunny trên biển vàng */}
      <motion.div
        className="relative aspect-[16/10] overflow-hidden rounded-lg border-2 border-[#d9a441]/50 shadow-[0_12px_28px_rgba(40,20,40,0.45)] sm:aspect-[16/9]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.12 }}
          animate={{ scale: 1.02 }}
          transition={{ duration: 9, ease: 'easeOut' }}
        >
          <FallbackImage sources={ASSETS.closingBg} alt="" className="h-full w-full object-cover object-[60%_50%]" loading="eager" />
        </motion.div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#24153f]/55 via-transparent to-[#24153f]/35" />

        <div className="absolute inset-x-0 top-0 px-4 pt-4 text-center sm:pt-6">
          <motion.p
            className="font-letter text-[10px] font-bold uppercase tracking-[0.4em] text-[#ffe2a8] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] sm:text-xs"
            initial={{ opacity: 0, letterSpacing: '0.9em' }}
            animate={{ opacity: 1, letterSpacing: '0.4em' }}
            transition={{ duration: 1, delay: 0.25, ease: 'easeOut' }}
          >
            Hải trình khép lại
          </motion.p>
          <motion.p
            className="title-poster title-shine mt-1 text-[clamp(1.9rem,8.5vw,3.2rem)] leading-none"
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.4 }}
          >
            THANK YOU, NAKAMA!
          </motion.p>
        </div>
      </motion.div>

      {/* Thư từ biệt trên giấy da, đè nhẹ lên tranh */}
      <motion.article
        className="relative mx-1.5 -mt-6 drop-shadow-[0_10px_18px_rgba(59,36,18,0.35)] sm:mx-6 sm:-mt-10"
        initial={{ opacity: 0, y: 30, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18, delay: 0.45 }}
      >
        <motion.div
          variants={letter}
          initial="hidden"
          animate="shown"
          className="bg-cover px-6 pb-6 pt-7 text-[#3b2412] sm:px-9"
          style={{ backgroundImage: `url(${ASSETS.letterPaper})`, clipPath: TORN_EDGE }}
        >
          {LINES.map((text) => (
            <motion.p key={text} variants={line} className="mb-3 font-letter text-[15px] italic leading-relaxed text-[#3b2412] first-letter:font-handwriting first-letter:text-2xl first-letter:not-italic first-letter:font-bold first-letter:text-[#8c2414] sm:text-base">
              {text}
            </motion.p>
          ))}

          <motion.p variants={line} className="mt-4 text-center font-handwriting text-[1.9rem] font-bold leading-tight text-[#8c2414] sm:text-4xl">
            Hẹn gặp bạn tại lễ tốt nghiệp nha!
          </motion.p>
          <svg viewBox="0 0 220 14" className="mx-auto mt-1 w-40 text-[#8a5a2b]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <motion.path
              d="M4 9 C 50 2, 90 13, 130 6 S 200 4, 216 8"
              variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1, transition: { duration: 1.1, ease: 'easeInOut' } } }}
            />
          </svg>

          <motion.div variants={line} className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-letter text-sm italic text-[#6b3f1d]">Thân ái,</p>
              <motion.p
                className="font-handwriting text-[2.2rem] font-bold leading-tight text-[#2b1a0d] sm:text-[2.6rem]"
                initial={{ clipPath: 'inset(-20% 100% -20% -5%)' }}
                animate={{ clipPath: 'inset(-20% -5% -20% -5%)' }}
                transition={{ duration: 1.4, delay: 1.9, ease: [0.45, 0, 0.3, 1] }}
              >
                {graduateName}
              </motion.p>
              <p className="whitespace-nowrap font-letter text-[9px] font-bold uppercase tracking-[0.18em] text-[#8a5a2b] sm:text-[10px] sm:tracking-[0.3em]">Thuyền trưởng · Class of 2026</p>
            </div>
            <StampIn rotate={-14} delay={2.6}>
              <div
                className="wax-seal flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[1.7rem] text-[#ffd9a0] sm:h-[4.5rem] sm:w-[4.5rem] sm:text-3xl"
                aria-hidden="true"
              >
                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">☠</span>
              </div>
            </StampIn>
          </motion.div>
        </motion.div>
      </motion.article>

      {onBack && (
        <motion.div
          className="mt-5 flex justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.4 }}
        >
          <button
            type="button"
            onClick={onBack}
            className="btn-sheen group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d9a441]/70 px-7 py-3 font-heading text-sm font-bold tracking-wide text-[#f6d48a] shadow-[0_8px_18px_rgba(24,58,89,0.4)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #183A59 0%, #2A5A8C 100%)' }}
          >
            <span className="icon-wiggle" aria-hidden="true">⚓</span>
            Quay lại thiệp
          </button>
        </motion.div>
      )}
    </div>
  )
}
