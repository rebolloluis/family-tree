'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadFile } from '@/lib/supabase/storage'
import type { Profile } from '@family-tree/shared'

const inits = (n: string) =>
  n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

export default function ProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const [fullName, setFullName]   = useState(profile?.full_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
    setAvatarUrl(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let finalAvatarUrl = avatarUrl
    if (pendingFile) {
      const ext = pendingFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      try {
        finalAvatarUrl = await uploadFile('avatars', path, pendingFile)
      } catch (err) {
        setError('Failed to upload photo.')
        setSaving(false)
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, avatar_url: finalAvatarUrl })
      .eq('id', user.id)

    if (error) { setError(error.message); setSaving(false); return }

    setSaved(true)
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
          <div className="photo-circle" onClick={() => fileRef.current?.click()} style={{ width: 80, height: 80, fontSize: '1.6rem' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span>{fullName ? inits(fullName) : '?'}</span>}
          </div>
          <span className="photo-hint">Tap to change photo</span>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>
      </div>

      <div className="field">
        <label>Full name</label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
      </div>

      {error && <p style={{ fontSize: '0.8rem', color: '#b03030' }}>{error}</p>}
      {saved && <p style={{ fontSize: '0.8rem', color: '#2d7a3a' }}>Saved!</p>}

      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
