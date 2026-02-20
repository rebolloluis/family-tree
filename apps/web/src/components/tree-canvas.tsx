'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Member, Family } from '@family-tree/shared'
import MemberModal from './member-modal'

type Props = {
  family: Pick<Family, 'id' | 'name' | 'description'>
  initialMembers: Member[]
  canEdit: boolean
  userId?: string | null
  userMemberId?: string | null
  userProfile?: { full_name: string | null; avatar_url: string | null } | null
}

type AddAs = 'root' | 'child' | 'sibling' | 'parent'

type ModalState =
  | { mode: 'add'; addAs: AddAs; anchorMember: Member | null; isSelfAdd?: boolean; prefill?: { name: string; photo_url: string | null } }
  | { mode: 'edit'; member: Member }

function addTitle(addAs: AddAs, anchor: Member | null): string {
  if (!anchor || addAs === 'root') return 'Add member'
  if (addAs === 'parent') return `Add parent of ${anchor.name}`
  if (addAs === 'sibling') return `Add sibling of ${anchor.name}`
  return `Add child of ${anchor.name}`
}

const inits = (n: string) =>
  n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

export default function TreeCanvas({ family, initialMembers, canEdit, userId, userMemberId: initialUserMemberId, userProfile }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [userMemberId, setUserMemberId] = useState<string | null>(initialUserMemberId ?? null)
  const [familyName, setFamilyName] = useState(family.name)
  const [familyDescription, setFamilyDescription] = useState(family.description ?? '')
  const [editingFamily, setEditingFamily] = useState(false)
  const [familyEditName, setFamilyEditName] = useState(family.name)
  const [familyEditDesc, setFamilyEditDesc] = useState(family.description ?? '')
  const [savingFamily, setSavingFamily] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const selected = members.find(m => m.id === selectedId) ?? null
  const selfInTree = userMemberId ? members.some(m => m.id === userMemberId) : false

  // Real-time sync
  useEffect(() => {
    const channel = supabase
      .channel(`family-${family.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'members', filter: `family_id=eq.${family.id}` },
        ({ new: row }) => setMembers(ms => ms.some(m => m.id === row.id) ? ms : [...ms, row as Member]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'members', filter: `family_id=eq.${family.id}` },
        ({ new: row }) => setMembers(ms => ms.map(m => m.id === row.id ? row as Member : m)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'members', filter: `family_id=eq.${family.id}` },
        ({ old: row }) => setMembers(ms => ms.filter(m => m.id !== row.id)))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [family.id])

  function buildGens(): Member[][] {
    const gens: Member[][] = []
    let cur = members.filter(m => !m.parent_id)
    while (cur.length) {
      gens.push(cur)
      const ids = cur.map(m => m.id)
      cur = members.filter(m => m.parent_id && ids.includes(m.parent_id))
    }
    return gens
  }

  const drawLines = useCallback(() => {
    const svg = svgRef.current
    const canvas = canvasRef.current
    if (!svg || !canvas) return
    svg.setAttribute('width', String(canvas.scrollWidth))
    svg.setAttribute('height', String(canvas.scrollHeight))

    const cr = canvas.getBoundingClientRect()
    const paths: string[] = []

    members.forEach(m => {
      if (!m.parent_id) return
      const pe = canvas.querySelector<HTMLElement>(`[data-id="${m.parent_id}"]`)
      const ce = canvas.querySelector<HTMLElement>(`[data-id="${m.id}"]`)
      if (!pe || !ce) return

      const pr = pe.getBoundingClientRect()
      const cer = ce.getBoundingClientRect()
      const px = pr.left + pr.width / 2 - cr.left + canvas.scrollLeft
      const py = pr.top + pr.height - cr.top + canvas.scrollTop
      const cx = cer.left + cer.width / 2 - cr.left + canvas.scrollLeft
      const cy = cer.top - cr.top + canvas.scrollTop
      const my = (py + cy) / 2
      paths.push(`M ${px} ${py} C ${px} ${my}, ${cx} ${my}, ${cx} ${cy}`)
    })

    svg.innerHTML = paths.map(d =>
      `<path d="${d}" fill="none" stroke="var(--line-color,#d0d0ce)" stroke-width="1.5"/>`
    ).join('')
  }, [members])

  useEffect(() => {
    requestAnimationFrame(drawLines)
  }, [members, drawLines])

  useEffect(() => {
    window.addEventListener('resize', drawLines)
    return () => window.removeEventListener('resize', drawLines)
  }, [drawLines])

  async function handleSave(data: Partial<Member>) {
    if (modal?.mode === 'edit') {
      const { data: updated } = await supabase
        .from('members').update(data).eq('id', modal.member.id).select().single()
      if (updated) setMembers(ms => ms.map(m => m.id === updated.id ? updated : m))
    } else if (modal?.mode === 'add') {
      const { addAs, anchorMember } = modal

      // Determine parent_id for the new member
      let newParentId: string | null = null
      if (addAs === 'child') newParentId = anchorMember?.id ?? null
      else if (addAs === 'sibling') newParentId = anchorMember?.parent_id ?? null
      else if (addAs === 'parent') newParentId = anchorMember?.parent_id ?? null
      // root: newParentId stays null

      const { data: created } = await supabase
        .from('members')
        .insert({ ...data, family_id: family.id, parent_id: newParentId })
        .select().single()

      if (created) {
        let updatedMembers = [...members, created]

        // For 'parent': re-parent the anchor under the new member
        if (addAs === 'parent' && anchorMember) {
          await supabase.from('members').update({ parent_id: created.id }).eq('id', anchorMember.id)
          updatedMembers = updatedMembers.map(m =>
            m.id === anchorMember.id ? { ...m, parent_id: created.id } : m
          )
        }

        setMembers(updatedMembers)

        if (modal.isSelfAdd && userId) {
          await supabase.from('profiles').update({ member_id: created.id }).eq('id', userId)
          setUserMemberId(created.id)
        }
      }
    }
    setModal(null)
  }

  async function handleDelete(id: string) {
    const desc = (pid: string): string[] => {
      const kids = members.filter(m => m.parent_id === pid).map(m => m.id)
      return [...kids, ...kids.flatMap(desc)]
    }
    const toDelete = [id, ...desc(id)]
    await supabase.from('members').delete().in('id', toDelete)
    setMembers(ms => ms.filter(m => !toDelete.includes(m.id)))
    if (selectedId && toDelete.includes(selectedId)) setSelectedId(null)
    if (userMemberId && toDelete.includes(userMemberId)) setUserMemberId(null)
    setModal(null)
  }

  async function handleThisIsMe() {
    if (!userId || !selectedId) return
    await supabase.from('profiles').update({ member_id: selectedId }).eq('id', userId)
    setUserMemberId(selectedId)
  }

  function openAddSelf() {
    setModal({
      mode: 'add',
      addAs: 'root',
      anchorMember: null,
      isSelfAdd: true,
      prefill: {
        name: userProfile?.full_name ?? '',
        photo_url: userProfile?.avatar_url ?? null,
      },
    })
  }

  async function handleFamilySave() {
    if (!familyEditName.trim()) return
    setSavingFamily(true)
    await supabase.from('families')
      .update({ name: familyEditName.trim(), description: familyEditDesc.trim() || null })
      .eq('id', family.id)
    setFamilyName(familyEditName.trim())
    setFamilyDescription(familyEditDesc.trim())
    setSavingFamily(false)
    setEditingFamily(false)
  }

  function openFamilyEdit() {
    setFamilyEditName(familyName)
    setFamilyEditDesc(familyDescription)
    setEditingFamily(true)
  }

  const gens = buildGens()

  return (
    <div className="tree-page">
      <header className="tree-header">
        <div>
          <h1 className="tree-title">
            {familyName}
            {canEdit && (
              <button className="tree-edit-btn" onClick={openFamilyEdit} title="Edit tree details">✎</button>
            )}
          </h1>
          {familyDescription && <p className="tree-desc">{familyDescription}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="member-count">
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </span>
          {canEdit && (
            <button className="btn-primary" onClick={() => setModal({ mode: 'add', addAs: 'root', anchorMember: null })}>
              + Add member
            </button>
          )}
        </div>
      </header>

      {/* "Add yourself" banner — shown when logged in and not yet in this tree */}
      {userId && !selfInTree && (
        <div className="self-banner">
          You&rsquo;re not in this tree yet.{' '}
          <button className="self-banner-btn" onClick={openAddSelf}>Add yourself</button>
        </div>
      )}

      <div
        className="canvas-wrap"
        onClick={e => {
          const t = e.target as HTMLElement
          if (!t.closest('.card') && !t.closest('.tray') && !t.closest('button')) {
            setSelectedId(null)
          }
        }}
      >
        <div className="tree-canvas" ref={canvasRef}>
          <svg ref={svgRef} className="svg-lines" />

          {gens.length === 0 ? (
            <div className="empty">
              <div className="empty-glyph">🌿</div>
              <h2>Begin your tree</h2>
              <p>Add a family member to start mapping your history.</p>
              {canEdit && (
                <button className="btn-primary" style={{ marginTop: '0.75rem' }}
                  onClick={() => setModal({ mode: 'add', addAs: 'root', anchorMember: null })}>
                  + Add first member
                </button>
              )}
            </div>
          ) : (
            gens.map((gen, gi) => (
              <div key={gi} className="gen-row">
                {gen.map(m => {
                  const isSelf = m.id === userMemberId
                  return (
                    <div
                      key={m.id}
                      data-id={m.id}
                      className={`card${m.id === selectedId ? ' selected' : ''}${isSelf ? ' card--self' : ''}`}
                      style={{ animationDelay: `${gi * 60}ms` }}
                      onClick={() => setSelectedId(id => id === m.id ? null : m.id)}
                    >
                      {isSelf && <span className="card-self-badge">You</span>}
                      <div className="avatar">
                        {m.photo_url
                          ? <img src={m.photo_url} alt="" />
                          : inits(m.name)}
                      </div>
                      <div className="card-name">{m.name}</div>
                      {(m.born || m.died) && (
                        <div className="card-meta">
                          {m.born && m.died ? `${m.born} – ${m.died}` : m.born ? `b. ${m.born}` : `d. ${m.died}`}
                        </div>
                      )}
                      {m.note && <div className="card-meta">{m.note}</div>}
                      {m.relation && <span className="card-tag">{m.relation}</span>}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tray */}
      <div className={`tray${selected ? ' open' : ''}`}>
        {selected && (
          <>
            <div className="tray-av">
              {selected.photo_url ? <img src={selected.photo_url} alt="" /> : inits(selected.name)}
            </div>
            <div className="tray-info">
              <div className="tray-name">{selected.name}</div>
              <div className="tray-meta">
                {[selected.relation, selected.born && (selected.died ? `${selected.born}–${selected.died}` : `b. ${selected.born}`), selected.note]
                  .filter(Boolean).join(' · ') || '—'}
              </div>
            </div>
            <div className="tray-btns">
              {userId && selected.id !== userMemberId && (
                <button className="btn-ghost" onClick={handleThisIsMe}>
                  This is me
                </button>
              )}
              {canEdit && (
                <>
                  <button className="btn-ghost tray-rel-btn"
                    onClick={() => setModal({ mode: 'add', addAs: 'parent', anchorMember: selected })}
                    title={`Add parent of ${selected.name}`}>
                    ↑ Parent
                  </button>
                  <button className="btn-ghost tray-rel-btn"
                    onClick={() => setModal({ mode: 'add', addAs: 'sibling', anchorMember: selected })}
                    title={`Add sibling of ${selected.name}`}>
                    ↔ Sibling
                  </button>
                  <button className="btn-ghost tray-rel-btn"
                    onClick={() => setModal({ mode: 'add', addAs: 'child', anchorMember: selected })}
                    title={`Add child of ${selected.name}`}>
                    ↓ Child
                  </button>
                  <button className="btn-primary"
                    onClick={() => setModal({ mode: 'edit', member: selected })}>
                    Edit
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {modal && (
        <MemberModal
          mode={modal.mode}
          member={modal.mode === 'edit' ? modal.member : undefined}
          familyId={family.id}
          prefill={modal.mode === 'add' ? modal.prefill : undefined}
          title={modal.mode === 'add' ? addTitle(modal.addAs, modal.anchorMember) : undefined}
          onSave={handleSave}
          onDelete={modal.mode === 'edit' ? () => handleDelete(modal.member.id) : undefined}
          onClose={() => setModal(null)}
        />
      )}

      {editingFamily && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setEditingFamily(false) }}>
          <div className="modal">
            <div className="modal-hd">
              <h2>Edit tree</h2>
              <button className="modal-x" onClick={() => setEditingFamily(false)}>✕</button>
            </div>
            <div className="field">
              <label>Tree name *</label>
              <input type="text" value={familyEditName} onChange={e => setFamilyEditName(e.target.value)} autoFocus />
            </div>
            <div className="field">
              <label>Description</label>
              <input type="text" value={familyEditDesc} onChange={e => setFamilyEditDesc(e.target.value)} placeholder="A short description…" />
            </div>
            <div className="modal-ft">
              <div />
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button className="btn-ghost" onClick={() => setEditingFamily(false)} disabled={savingFamily}>Cancel</button>
                <button className="btn-primary" onClick={handleFamilySave} disabled={savingFamily || !familyEditName.trim()}>
                  {savingFamily ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
