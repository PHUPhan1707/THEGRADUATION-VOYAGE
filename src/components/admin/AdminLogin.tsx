import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { supabase } from '../../lib/supabase'
import { isSupabaseConfigured, STORAGE_KEYS } from '../../lib/storage'

interface AdminLoginProps {
  onLogin: () => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!isSupabaseConfigured() || !supabase) {
        // Chế độ không có backend chỉ dành cho phát triển trên máy (npm run dev).
        // Bản build production KHÔNG chứa tài khoản demo.
        if (import.meta.env.DEV && email === 'admin@voyage.local' && password === 'voyage2026') {
          localStorage.setItem(STORAGE_KEYS.adminSession, 'authenticated')
          onLogin()
        } else {
          setError(
            import.meta.env.DEV
              ? 'Sai thông tin đăng nhập local. Dùng admin@voyage.local / voyage2026 để test.'
              : 'Trang quản trị cần cấu hình Supabase (VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY).',
          )
        }
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message === 'Invalid login credentials'
          ? 'Sai email hoặc mật khẩu. Thử lại nhé, thuyền trưởng!'
          : authError.message)
      } else {
        onLogin()
      }
    } catch {
      setError('Không thể kết nối server. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-4">
      {/* Animated wave background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Wave layers */}
        <div className="absolute bottom-0 left-0 h-40 w-[200%] animate-wave opacity-10">
          <svg viewBox="0 0 1440 320" className="h-full w-full fill-ocean-blue">
            <path d="M0,192L48,186.7C96,181,192,171,288,186.7C384,203,480,245,576,250.7C672,256,768,224,864,197.3C960,171,1056,149,1152,154.7C1248,160,1344,192,1392,208L1440,224L1440,320L0,320Z" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 h-32 w-[200%] animate-wave opacity-5" style={{ animationDelay: '-2s', animationDuration: '10s' }}>
          <svg viewBox="0 0 1440 320" className="h-full w-full fill-sunny-sky">
            <path d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,224,576,234.7C672,245,768,245,864,229.3C960,213,1056,181,1152,181.3C1248,181,1344,213,1392,229.3L1440,245L1440,320L0,320Z" />
          </svg>
        </div>

        {/* Floating decorative elements */}
        <motion.div
          className="absolute top-[15%] left-[10%] text-4xl opacity-20"
          animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          ⚓
        </motion.div>
        <motion.div
          className="absolute top-[25%] right-[15%] text-3xl opacity-15"
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          🧭
        </motion.div>
        <motion.div
          className="absolute bottom-[25%] left-[20%] text-2xl opacity-10"
          animate={{ y: [-8, 8, -8], x: [-5, 5, -5] }}
          transition={{ duration: 7, repeat: Infinity }}
        >
          ⛵
        </motion.div>
      </div>

      {/* Login card */}
      <motion.div
        className="parchment-bg gold-border relative z-10 w-full max-w-md rounded-2xl p-8"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="relative z-10">
          {/* Title */}
          <motion.h1
            className="mb-2 text-center font-heading text-3xl font-bold text-treasure-gold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            ⚓ Thuyền Trưởng Đăng Nhập
          </motion.h1>
          <motion.p
            className="mb-8 text-center text-sm text-navy/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Chỉ thuyền trưởng Phan An Phú mới có quyền truy cập
          </motion.p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-navy/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="captain@grandline.com"
                className="w-full rounded-lg border-2 border-treasure-gold/50 bg-navy px-4 py-3 text-parchment placeholder-parchment/40 outline-none transition-colors focus:border-treasure-gold"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-navy/80">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg border-2 border-treasure-gold/50 bg-navy px-4 py-3 text-parchment placeholder-parchment/40 outline-none transition-colors focus:border-treasure-gold"
              />
            </motion.div>

            {/* Error message */}
            {error && (
              <motion.div
                className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                ⚠️ {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-lg bg-treasure-gold px-6 py-3 font-heading text-lg font-bold text-navy transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <motion.span
                    className="inline-block h-4 w-4 rounded-full border-2 border-navy border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </motion.button>
          </form>

          {/* Footer hint */}
          <motion.p
            className="mt-6 text-center text-xs text-navy/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            🏴‍☠️ Hệ thống quản lý The Graduation Voyage
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
