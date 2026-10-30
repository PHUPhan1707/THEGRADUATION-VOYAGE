import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '../../lib/supabase'
import {
  isSupabaseConfigured,
  getLocalGuests,
  saveLocalGuests,
  getLocalEventConfig,
  saveLocalEventConfig,
  getLocalPhotos,
  saveLocalPhotos,
} from '../../lib/storage'
import { fetchRemoteEventConfig, fetchRemoteGuests, saveRemoteEventConfig, upsertRemoteGuest } from '../../lib/api'
import { getGuestPath, getGuestUrl } from '../../lib/links'
import type { Guest, EventConfig, GalleryPhoto } from '../../types'

type TabId = 'guests' | 'settings' | 'gallery'

const CATEGORY_LABELS: Record<Guest['category'], string> = {
  friend: 'Bạn bè',
  family: 'Gia đình',
  teacher: 'Thầy/Cô',
  special: 'Khách đặc biệt',
}

const CATEGORY_COLORS: Record<Guest['category'], string> = {
  friend: 'bg-ocean-blue text-white',
  family: 'bg-coral text-white',
  teacher: 'bg-treasure-gold text-navy',
  special: 'bg-gold-light text-navy',
}

const RSVP_LABELS: Record<Guest['rsvpStatus'], string> = {
  pending: 'Chưa phản hồi',
  attending: 'Sẽ tham dự',
  declined: 'Từ chối',
}

const RSVP_COLORS: Record<Guest['rsvpStatus'], string> = {
  pending: 'text-parchment-dark',
  attending: 'text-green-400',
  declined: 'text-coral',
}

function generateInviteId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  const bytes = new Uint32Array(12)
  crypto.getRandomValues(bytes)
  for (const byte of bytes) {
    result += chars.charAt(byte % chars.length)
  }
  return result
}


// ═══════════════════════════════════════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('guests')

  const handleLogout = async () => {
    try {
      if (supabase) await supabase.auth.signOut()
      localStorage.removeItem('voyage_admin_session')
    } catch {
      // ignore
    }
    window.location.reload()
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'guests', label: 'Khách mời', icon: '👥' },
    { id: 'settings', label: 'Cài đặt sự kiện', icon: '⚙️' },
    { id: 'gallery', label: 'Thư viện ảnh', icon: '📸' },
  ]

  return (
    <div className="min-h-screen bg-navy text-parchment">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-treasure-gold/20 bg-navy/95 px-4 py-3 backdrop-blur-sm md:px-8">
        <h1 className="font-heading text-lg font-bold text-treasure-gold md:text-xl">
          ⚓ THE GRADUATION VOYAGE – Admin
        </h1>
        <motion.button
          onClick={handleLogout}
          className="cursor-pointer rounded-lg border border-coral/50 px-4 py-2 text-sm text-coral transition-colors hover:bg-coral/10"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Đăng xuất
        </motion.button>
      </header>

      {/* Tab navigation */}
      <nav className="border-b border-treasure-gold/10 bg-navy-light/30 px-4 md:px-8">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative cursor-pointer whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors md:text-base ${activeTab === tab.id
                  ? 'text-treasure-gold'
                  : 'text-parchment/60 hover:text-parchment/80'
                }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-treasure-gold"
                  layoutId="tab-underline"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <AnimatePresence mode="wait">
          {activeTab === 'guests' && (
            <motion.div
              key="guests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GuestTab />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsTab />
            </motion.div>
          )}
          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <GalleryTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Guest Tab
// ═══════════════════════════════════════════════════════════════════════
function GuestTab() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<Guest['category'] | 'all'>('all')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')

  // Form state
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState<Guest['category']>('friend')
  const [formMessage, setFormMessage] = useState('')

  const [saveError, setSaveError] = useState('')

  const loadGuests = useCallback(async () => {
    const remote = await fetchRemoteGuests()
    setGuests(remote ?? getLocalGuests())
  }, [])

  /** Lưu 1 khách: Supabase nếu có, ngược lại localStorage. Trả về true nếu thành công. */
  const persistGuest = async (guest: Guest): Promise<boolean> => {
    setSaveError('')
    if (isSupabaseConfigured()) {
      try {
        await upsertRemoteGuest(guest)
        return true
      } catch (err) {
        setSaveError(`Không lưu được lên Supabase: ${err instanceof Error ? err.message : 'lỗi không rõ'}`)
        return false
      }
    }
    const local = getLocalGuests()
    const idx = local.findIndex((g) => g.id === guest.id)
    if (idx >= 0) local[idx] = guest
    else local.unshift(guest)
    saveLocalGuests(local)
    return true
  }

  useEffect(() => {
    loadGuests()
  }, [loadGuests])

  const resetForm = () => {
    setFormName('')
    setFormCategory('friend')
    setFormMessage('')
    setEditingGuest(null)
    setGeneratedLink('')
  }

  const handleCreateGuest = async (e: FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const inviteId = editingGuest ? editingGuest.inviteId : generateInviteId()
    const now = new Date().toISOString()

    const guest: Guest = {
      id: editingGuest ? editingGuest.id : crypto.randomUUID(),
      name: formName.trim(),
      category: formCategory,
      personalMessage: formMessage.trim() || undefined,
      inviteId,
      rsvpStatus: editingGuest ? editingGuest.rsvpStatus : 'pending',
      rsvpMessage: editingGuest?.rsvpMessage,
      createdAt: editingGuest ? editingGuest.createdAt : now,
      updatedAt: now,
      revoked: editingGuest ? editingGuest.revoked : false,
    }

    const ok = await persistGuest(guest)
    if (!ok) return

    setGeneratedLink(getGuestUrl(guest))

    await loadGuests()
    if (editingGuest) {
      setShowForm(false)
      resetForm()
    }
  }

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest)
    setFormName(guest.name)
    setFormCategory(guest.category)
    setFormMessage(guest.personalMessage || '')
    setGeneratedLink('')
    setShowForm(true)
  }

  const handleRevoke = async (guest: Guest) => {
    const updated = { ...guest, revoked: !guest.revoked, updatedAt: new Date().toISOString() }
    await persistGuest(updated)
    await loadGuests()
  }

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopyFeedback(link)
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = link
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopyFeedback(link)
      setTimeout(() => setCopyFeedback(''), 2000)
    }
  }

  const getGuestLink = (guest: Guest) => getGuestUrl(guest)

  const handlePreview = (guest: Guest) => {
    window.open(getGuestPath(guest), '_blank')
  }

  // Filter guests
  const filteredGuests = guests.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = filterCategory === 'all' || g.category === filterCategory
    return matchSearch && matchCategory
  })

  // Stats
  const totalGuests = guests.length
  const attending = guests.filter((g) => g.rsvpStatus === 'attending').length
  const declined = guests.filter((g) => g.rsvpStatus === 'declined').length
  const pending = guests.filter((g) => g.rsvpStatus === 'pending').length

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Tổng khách" value={totalGuests} icon="👥" color="bg-ocean-blue/20 border-ocean-blue/40" />
        <StatCard label="Sẽ tham dự" value={attending} icon="✅" color="bg-green-900/30 border-green-500/40" />
        <StatCard label="Từ chối" value={declined} icon="❌" color="bg-coral/20 border-coral/40" />
        <StatCard label="Chưa phản hồi" value={pending} icon="⏳" color="bg-treasure-gold/20 border-treasure-gold/40" />
      </div>

      {/* Actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <input
            type="text"
            placeholder="🔍 Tìm theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-treasure-gold/30 bg-navy-light/50 px-4 py-2 text-sm text-parchment placeholder-parchment/40 outline-none focus:border-treasure-gold sm:max-w-xs"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as Guest['category'] | 'all')}
            className="rounded-lg border border-treasure-gold/30 bg-navy-light/50 px-3 py-2 text-sm text-parchment outline-none focus:border-treasure-gold"
          >
            <option value="all">Tất cả</option>
            <option value="friend">Bạn bè</option>
            <option value="family">Gia đình</option>
            <option value="teacher">Thầy/Cô</option>
            <option value="special">Khách đặc biệt</option>
          </select>
        </div>

        <motion.button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="cursor-pointer rounded-lg bg-treasure-gold px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-gold-light"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {showForm ? '✕ Đóng' : '＋ Thêm khách mời'}
        </motion.button>
      </div>

      {/* Add/Edit Guest Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="overflow-hidden rounded-xl border border-treasure-gold/30 bg-navy-light/40 p-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="mb-4 font-heading text-lg font-bold text-treasure-gold">
              {editingGuest ? '✏️ Chỉnh sửa khách mời' : '🏴‍☠️ Tạo lời mời mới'}
            </h3>
            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-parchment/70">Tên khách mời</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Monkey D. Luffy"
                    className="w-full rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment placeholder-parchment/30 outline-none focus:border-treasure-gold"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-parchment/70">Nhóm</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Guest['category'])}
                    className="w-full rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment outline-none focus:border-treasure-gold"
                  >
                    <option value="friend">Bạn bè</option>
                    <option value="family">Gia đình</option>
                    <option value="teacher">Thầy/Cô</option>
                    <option value="special">Khách đặc biệt</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-parchment/70">
                  Lời nhắn cá nhân <span className="text-parchment/40">(tùy chọn)</span>
                </label>
                <textarea
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  rows={3}
                  placeholder="Viết lời nhắn riêng cho khách mời này..."
                  className="w-full resize-none rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment placeholder-parchment/30 outline-none focus:border-treasure-gold"
                />
              </div>
              <div className="flex gap-3">
                <motion.button
                  type="submit"
                  className="cursor-pointer rounded-lg bg-treasure-gold px-6 py-2.5 font-bold text-navy transition-colors hover:bg-gold-light"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {editingGuest ? '💾 Cập nhật' : '🗺️ Tạo lời mời'}
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="cursor-pointer rounded-lg border border-parchment/20 px-4 py-2.5 text-parchment/60 transition-colors hover:text-parchment"
                >
                  Hủy
                </button>
              </div>
            </form>

            {/* Generated link */}
            {generatedLink && (
              <motion.div
                className="mt-4 rounded-lg border border-green-500/30 bg-green-900/20 p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="mb-2 text-sm font-medium text-green-400">
                  ✅ Lời mời đã được tạo thành công!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 overflow-hidden text-ellipsis rounded bg-navy/60 px-3 py-2 text-xs text-parchment">
                    {generatedLink}
                  </code>
                  <motion.button
                    onClick={() => handleCopyLink(generatedLink)}
                    className="cursor-pointer whitespace-nowrap rounded-lg bg-ocean-blue px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-ocean-blue/80"
                    whileTap={{ scale: 0.95 }}
                  >
                    {copyFeedback === generatedLink ? '✓ Đã sao chép!' : '📋 Sao chép link'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {saveError && (
        <p role="alert" className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">
          ⚠️ {saveError}
        </p>
      )}

      {/* Guest list */}
      <div className="space-y-2">
        {filteredGuests.length === 0 ? (
          <div className="rounded-xl border border-treasure-gold/10 bg-navy-light/20 py-16 text-center text-parchment/40">
            <p className="text-4xl">🏴‍☠️</p>
            <p className="mt-2">
              {guests.length === 0
                ? 'Chưa có khách mời nào. Hãy thêm thuyền viên đầu tiên!'
                : 'Không tìm thấy khách mời phù hợp.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden rounded-t-lg bg-navy-light/50 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-parchment/50 md:grid md:grid-cols-12 md:gap-2">
              <div className="col-span-3">Tên</div>
              <div className="col-span-2">Nhóm</div>
              <div className="col-span-2">RSVP</div>
              <div className="col-span-3">Link</div>
              <div className="col-span-2 text-right">Thao tác</div>
            </div>
            {filteredGuests.map((guest) => {
              const link = getGuestLink(guest)
              const shortLink = getGuestPath(guest)
              return (
                <motion.div
                  key={guest.id}
                  className={`rounded-lg border px-4 py-3 transition-colors ${guest.revoked
                      ? 'border-coral/20 bg-coral/5 opacity-60'
                      : 'border-treasure-gold/10 bg-navy-light/20 hover:border-treasure-gold/30'
                    }`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: guest.revoked ? 0.6 : 1, x: 0 }}
                  layout
                >
                  {/* Mobile layout */}
                  <div className="flex flex-col gap-2 md:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-parchment">
                          {guest.name}
                        </span>
                        {guest.revoked && (
                          <span className="rounded bg-coral/20 px-1.5 py-0.5 text-[10px] text-coral">
                            Đã thu hồi
                          </span>
                        )}
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[guest.category]}`}>
                        {CATEGORY_LABELS[guest.category]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={RSVP_COLORS[guest.rsvpStatus]}>
                        {RSVP_LABELS[guest.rsvpStatus]}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleCopyLink(link)}
                          className="cursor-pointer rounded bg-navy px-2 py-1 text-xs text-parchment/60 transition-colors hover:text-treasure-gold"
                          title="Sao chép link"
                        >
                          {copyFeedback === link ? '✓' : '📋'}
                        </button>
                        <button
                          onClick={() => handleEdit(guest)}
                          className="cursor-pointer rounded bg-navy px-2 py-1 text-xs text-parchment/60 transition-colors hover:text-treasure-gold"
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handlePreview(guest)}
                          className="cursor-pointer rounded bg-navy px-2 py-1 text-xs text-parchment/60 transition-colors hover:text-ocean-blue"
                          title="Xem trước"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleRevoke(guest)}
                          className="cursor-pointer rounded bg-navy px-2 py-1 text-xs text-parchment/60 transition-colors hover:text-coral"
                          title={guest.revoked ? 'Khôi phục' : 'Thu hồi'}
                        >
                          {guest.revoked ? '🔓' : '🔒'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden items-center md:grid md:grid-cols-12 md:gap-2">
                    <div className="col-span-3 flex items-center gap-2">
                      <span className="font-medium text-parchment">{guest.name}</span>
                      {guest.revoked && (
                        <span className="rounded bg-coral/20 px-1.5 py-0.5 text-[10px] text-coral">
                          Thu hồi
                        </span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[guest.category]}`}>
                        {CATEGORY_LABELS[guest.category]}
                      </span>
                    </div>
                    <div className={`col-span-2 text-sm ${RSVP_COLORS[guest.rsvpStatus]}`}>
                      {RSVP_LABELS[guest.rsvpStatus]}
                    </div>
                    <div className="col-span-3 flex items-center gap-1.5">
                      <code className="flex-1 overflow-hidden text-ellipsis text-xs text-parchment/50">
                        {shortLink}
                      </code>
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="cursor-pointer rounded px-1.5 py-0.5 text-xs text-parchment/40 transition-colors hover:text-treasure-gold"
                        title="Sao chép link"
                      >
                        {copyFeedback === link ? '✓' : '📋'}
                      </button>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(guest)}
                        className="cursor-pointer rounded px-2 py-1 text-xs text-parchment/50 transition-colors hover:bg-treasure-gold/10 hover:text-treasure-gold"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handlePreview(guest)}
                        className="cursor-pointer rounded px-2 py-1 text-xs text-parchment/50 transition-colors hover:bg-ocean-blue/10 hover:text-ocean-blue"
                        title="Xem trước"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleRevoke(guest)}
                        className="cursor-pointer rounded px-2 py-1 text-xs text-parchment/50 transition-colors hover:bg-coral/10 hover:text-coral"
                        title={guest.revoked ? 'Khôi phục' : 'Thu hồi'}
                      >
                        {guest.revoked ? '🔓' : '🔒'}
                      </button>
                    </div>
                  </div>

                  {guest.rsvpMessage && (
                    <p className="mt-2 rounded bg-navy/40 px-3 py-1.5 text-xs italic text-parchment/70">
                      💬 “{guest.rsvpMessage}”
                    </p>
                  )}
                </motion.div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <motion.span
          className="font-heading text-2xl font-bold text-parchment"
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {value}
        </motion.span>
      </div>
      <p className="mt-1 text-sm text-parchment/60">{label}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Settings Tab
// ═══════════════════════════════════════════════════════════════════════
function SettingsTab() {
  const [config, setConfig] = useState<EventConfig>(getLocalEventConfig())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Nếu có Supabase thì lấy cấu hình hiện tại từ đó
  useEffect(() => {
    let active = true
    fetchRemoteEventConfig().then((remote) => {
      if (active && remote) setConfig(remote)
    })
    return () => {
      active = false
    }
  }, [])

  const handleChange = (field: keyof EventConfig, value: string | null) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const updatedConfig = { ...config, updatedAt: new Date().toISOString() }

    try {
      if (isSupabaseConfigured()) {
        await saveRemoteEventConfig(updatedConfig)
      } else {
        saveLocalEventConfig(updatedConfig)
      }
      setConfig(updatedConfig)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(`Không lưu được: ${err instanceof Error ? err.message : 'lỗi không rõ'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-treasure-gold/20 bg-navy-light/20 p-6">
        <h3 className="mb-5 font-heading text-xl font-bold text-treasure-gold">🗓️ Thông tin sự kiện</h3>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-parchment/70">Ngày tốt nghiệp</label>
              <input
                type="date"
                value={config.graduationDate}
                onChange={(e) => handleChange('graduationDate', e.target.value)}
                className="w-full rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment outline-none focus:border-treasure-gold"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-parchment/70">
                Giờ lễ{' '}
                {!config.ceremonyTime && (
                  <span className="text-xs text-treasure-gold/60">(Chưa xác nhận)</span>
                )}
              </label>
              <input
                type="time"
                value={config.ceremonyTime || ''}
                onChange={(e) => handleChange('ceremonyTime', e.target.value || null)}
                className="w-full rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment outline-none focus:border-treasure-gold"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-parchment/70">Địa điểm</label>
            <input
              type="text"
              value={config.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
              className="w-full rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment outline-none focus:border-treasure-gold"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-parchment/70">Google Maps link</label>
            <input
              type="url"
              value={config.mapsLink || ''}
              onChange={(e) => handleChange('mapsLink', e.target.value || null)}
              placeholder="https://maps.google.com/..."
              className="w-full rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment placeholder-parchment/30 outline-none focus:border-treasure-gold"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-treasure-gold/20 bg-navy-light/20 p-6">
        <h3 className="mb-5 font-heading text-xl font-bold text-treasure-gold">🎨 Media</h3>

        <p className="mb-4 text-xs text-parchment/50">
          Ảnh và nhạc được đặt thẳng vào thư mục <code>public/</code> (xem <code>CHUAN_BI_ANH.md</code>). Chỉ điền ô
          bên dưới nếu muốn dùng đường dẫn khác; để trống sẽ dùng file mặc định.
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-parchment/70">🎵 Đường dẫn nhạc nền</label>
            <input
              type="text"
              value={config.musicUrl || ''}
              onChange={(e) => handleChange('musicUrl', e.target.value || null)}
              placeholder="/audio/bgm.mp3"
              className="w-full rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment placeholder-parchment/30 outline-none focus:border-treasure-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-parchment/70">📷 Đường dẫn ảnh chân dung (tuỳ chọn)</label>
            <input
              type="text"
              value={config.portraitUrl || ''}
              onChange={(e) => handleChange('portraitUrl', e.target.value || null)}
              placeholder="/images/portrait/graduate.png"
              className="w-full rounded-lg border border-treasure-gold/30 bg-navy px-4 py-2.5 text-parchment placeholder-parchment/30 outline-none focus:border-treasure-gold"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <motion.button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-lg bg-treasure-gold px-8 py-3 font-heading font-bold text-navy transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {saving ? '⏳ Đang lưu...' : '💾 Lưu cài đặt'}
        </motion.button>
        {saved && (
          <motion.span
            className="text-sm text-green-400"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            ✅ Đã lưu thành công!
          </motion.span>
        )}
        {error && (
          <span role="alert" className="text-sm text-coral">
            ⚠️ {error}
          </span>
        )}
      </div>

      {!isSupabaseConfigured() && (
        <p className="rounded-lg border border-treasure-gold/20 bg-treasure-gold/5 px-4 py-3 text-xs text-treasure-gold/60">
          ⚠️ Supabase chưa được cấu hình. Dữ liệu đang được lưu vào localStorage của trình duyệt.
        </p>
      )}
    </form>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Gallery Tab
// ═══════════════════════════════════════════════════════════════════════
function GalleryTab() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    setPhotos(getLocalPhotos())
  }, [])

  const addPhoto = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const newPhoto: GalleryPhoto = {
        id: crypto.randomUUID(),
        url: reader.result as string,
        caption: '',
        order: photos.length,
        createdAt: new Date().toISOString(),
      }
      const updated = [...photos, newPhoto]
      setPhotos(updated)
      saveLocalPhotos(updated)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(addPhoto)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .forEach(addPhoto)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const updateCaption = (id: string, caption: string) => {
    const updated = photos.map((p) => (p.id === id ? { ...p, caption } : p))
    setPhotos(updated)
    saveLocalPhotos(updated)
  }

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= photos.length) return
    const updated = [...photos]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    // Recompute order
    updated.forEach((p, i) => {
      p.order = i
    })
    setPhotos(updated)
    saveLocalPhotos(updated)
  }

  const deletePhoto = (id: string) => {
    const updated = photos.filter((p) => p.id !== id)
    updated.forEach((p, i) => {
      p.order = i
    })
    setPhotos(updated)
    saveLocalPhotos(updated)
  }

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-treasure-gold/20 bg-treasure-gold/5 px-4 py-3 text-sm text-parchment/70">
        ℹ️ Gallery <strong>chính thức</strong> (khách mời nhìn thấy) lấy từ thư mục{' '}
        <code>public/images/gallery/</code> + file <code>gallery.json</code> (xem <code>CHUAN_BI_ANH.md</code>).
        Ảnh tải ở tab này chỉ lưu trên trình duyệt này, dùng để xem thử khi chưa có ảnh trong thư mục.
      </p>

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${isDragging
            ? 'border-treasure-gold bg-treasure-gold/10'
            : 'border-treasure-gold/30 bg-navy-light/20 hover:border-treasure-gold/50'
          }`}
      >
        <span className="text-5xl">📸</span>
        <p className="mt-3 text-lg font-medium text-parchment/80">Kéo thả ảnh vào đây</p>
        <p className="mt-1 text-sm text-parchment/40">hoặc</p>
        <label className="mt-3 cursor-pointer rounded-lg bg-treasure-gold px-5 py-2 text-sm font-bold text-navy transition-colors hover:bg-gold-light">
          Chọn ảnh từ máy
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="py-12 text-center text-parchment/40">
          <p className="text-4xl">🖼️</p>
          <p className="mt-2">Chưa có ảnh nào. Hãy thêm ảnh kỷ niệm!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              className="group overflow-hidden rounded-xl border border-treasure-gold/20 bg-navy-light/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              layout
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption || `Ảnh ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {/* Overlay controls */}
                <div className="absolute inset-0 flex items-start justify-end gap-1 bg-gradient-to-b from-navy/60 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => movePhoto(index, 'up')}
                    disabled={index === 0}
                    className="cursor-pointer rounded bg-navy/70 px-2 py-1 text-xs text-parchment transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:opacity-30"
                    title="Lên trước"
                  >
                    ⬆️
                  </button>
                  <button
                    onClick={() => movePhoto(index, 'down')}
                    disabled={index === photos.length - 1}
                    className="cursor-pointer rounded bg-navy/70 px-2 py-1 text-xs text-parchment transition-colors hover:bg-navy disabled:cursor-not-allowed disabled:opacity-30"
                    title="Xuống sau"
                  >
                    ⬇️
                  </button>
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="cursor-pointer rounded bg-coral/70 px-2 py-1 text-xs text-white transition-colors hover:bg-coral"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Caption */}
              <div className="p-3">
                <input
                  type="text"
                  value={photo.caption || ''}
                  onChange={(e) => updateCaption(photo.id, e.target.value)}
                  placeholder="Thêm chú thích..."
                  className="w-full rounded border border-treasure-gold/20 bg-navy/50 px-3 py-1.5 text-sm text-parchment placeholder-parchment/30 outline-none focus:border-treasure-gold"
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p className="text-center text-xs text-parchment/40">
          📝 {photos.length} ảnh | Dữ liệu được lưu trong localStorage
        </p>
      )}
    </div>
  )
}
