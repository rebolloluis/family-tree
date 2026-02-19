'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CreateFamilyForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not signed in.'); setLoading(false); return }

    const { data, error } = await supabase
      .from('families')
      .insert({ name, description: description || null, owner_id: user.id })
      .select('id')
      .single()

    if (error) { setError(error.message); setLoading(false); return }
    router.push(`/tree/${data.id}`)
    router.refresh()
  }

  if (!open) {
    return (
      <button className="btn-primary" onClick={() => setOpen(true)}>
        + New tree
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="create-family-form">
      <input
        type="text"
        placeholder="Family name (e.g. The Webb Family)"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        autoFocus
        style={{ flex: 1 }}
      />
      <input
        type="text"
        placeholder="Short description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        style={{ flex: 1 }}
      />
      {error && <p style={{ fontSize: '0.78rem', color: '#b03030', width: '100%' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  )
}
