export interface Guest {
  id: string
  name: string
  category: 'friend' | 'family' | 'teacher' | 'special'
  personalMessage?: string
  inviteId: string
  rsvpStatus: 'pending' | 'attending' | 'declined'
  rsvpMessage?: string
  createdAt: string
  updatedAt: string
  revoked: boolean
}

export interface EventConfig {
  id: string
  graduateName: string
  university: string
  graduationDate: string
  ceremonyTime: string | null
  venue: string
  mapsLink: string | null
  portraitUrl: string | null
  ogImageUrl: string | null
  musicUrl: string | null
  updatedAt: string
}

export interface GalleryPhoto {
  id: string
  url: string
  caption?: string
  order: number
  createdAt: string
}
