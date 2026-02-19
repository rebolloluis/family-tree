'use client'

import { useState, useRef } from 'react'
import type { Member } from '@family-tree/shared'

type Props = {
  mode: 'add' | 'edit'
  member?: Member
  onSave: (data: Partial<Member>) => void
  onDelete?: () => void
  onClose: () => void
}

const RELATIONS = ['Grandfather', 'Grandmother', 'Father', 'Mother', 'Son', 'Daughter',
  'Brother', 'Sister', 'Aunt', 'Uncle', 'Cousin', 'Spouse', 'Other']

const inits = (n: string) =>
  n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

export default function MemberModal({ mode, member, onSave, onDelete, onClose }: Props) {
  const [name, setName]         = useState(member?.name ?? '')
  const [born, setBorn]         = useState(member?.born?.toString() ?? '')
  const [died, setDied]         = useState(member?.died?.toString() ?? '')
  const [relation, setRelation] = useState(member?.relation ?? '')
  const [note, setNote]         = useState(member?.note ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(member?.photo_url ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhotoUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      born: born ? parseInt(born) : null,
      died: died ? parseInt(died) : null,
      relation: relation || null,
      note: note.trim() || null,
      photo_url: photoUrl,
    })
  }

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-hd">
          <h2>{mode === 'add' ? 'Add member' : 'Edit member'}</h2>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        <div className="photo-wrap">
          <div className="photo-circle" onClick={() => fileRef.current?.click()}>
            {photoUrl
              ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span>{name ? inits(name) : '+'}</span>}
          </div>
          <span className="photo-hint">Tap to add photo</span>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>

        <div className="field">
          <label>Full name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Margaret Webb" autoFocus />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Born</label>
            <input type="number" value={born} onChange={e => setBorn(e.target.value)} placeholder="1948" min={1000} max={2100} />
          </div>
          <div className="field">
            <label>Died</label>
            <input type="number" value={died} onChange={e => setDied(e.target.value)} placeholder="(living)" min={1000} max={2100} />
          </div>
        </div>

        <div className="field">
          <label>Relation</label>
          <select value={relation} onChange={e => setRelation(e.target.value)}>
            <option value="">— Select —</option>
            {RELATIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Note</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Occupation, hometown…" />
        </div>

        <div className="modal-ft">
          <div>
            {onDelete && (
              <button className="btn-danger" onClick={() => { if (confirm('Delete this member and all descendants?')) onDelete() }}>
                Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}
