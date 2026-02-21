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

type AddAs = 'root' | 'child' | 'sibling' | 'parent' | 'spouse'

type ModalState =
  | { mode: 'add'; addAs: AddAs; anchorMember: Member | null; isSelfAdd?: boolean; prefill?: { name: string; photo_url: string | null } }
  | { mode: 'edit'; member: Member }

function addTitle(addAs: AddAs, anchor: Member | null): string {
  if (!anchor || addAs === 'root') return 'Add member'
  if (addAs === 'parent') return `Add parent of ${anchor.name}`
  if (addAs === 'sibling') return `Add sibling of ${anchor.name}`
  if (addAs === 'spouse') return `Add spouse of ${anchor.name}`
  return `Add child of ${anchor.name}`
}

const inits = (n: string) =>
  n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

function MemberCard({ m, selectedId, userMemberId, onSelect, animDelay }: {
  m: Member
  selectedId: string | null
  userMemberId: string | null
  onSelect: (id: string) => void
  animDelay: number
}) {
  const isSelf = m.id === userMemberId
  return (
    <div
      data-id={m.id}
      className={`card${m.id === selectedId ? ' selected' : ''}${isSelf ? ' card--self' : ''}`}
      style={{ animationDelay: `${animDelay}ms` }}
      onClick={() => onSelect(m.id)}
    >
      {isSelf && <span className="card-self-badge">You</span>}
      <div className="avatar">
        {m.photo_url ? <img src={m.photo_url} alt="" /> : inits(m.name)}
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
}

export default function TreeCanvas({ family, initialMembers, canEdit, userId, userMemberId: initialUserMemberId, userProfile }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [showRelPicker, setShowRelPicker] = useState(false)
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

  // Close rel picker when selection changes
  useEffect(() => { setShowRelPicker(false) }, [selectedId])

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

  // Spouses are rendered inline next to their partner, not as independent gen members
  function buildGens(): Member[][] {
    const gens: Member[][] = []
    let cur = members.filter(m => !m.parent_id && !m.spouse_of)
    while (cur.length) {
      gens.push(cur)
      const ids = cur.map(m => m.id)
      cur = members.filter(m => m.parent_id && ids.includes(m.parent_id) && !m.spouse_of)
    }
    return gens
  }

  // Returns all descendant IDs of memberId (via parent_id or parent2_id links)
  function getDescendants(memberId: string): Set<string> {
    const result = new Set<string>()
    const queue = [memberId]
    while (queue.length) {
      const id = queue.shift()!
      members
        .filter(m => m.parent_id === id || m.parent2_id === id)
        .forEach(c => { if (!result.has(c.id)) { result.add(c.id); queue.push(c.id) } })
    }
    return result
  }

  const drawLines = useCallback(() => {
    const svg = svgRef.current
    const canvas = canvasRef.current
    if (!svg || !canvas) return
    svg.setAttribute('width', String(canvas.scrollWidth))
    svg.setAttribute('height', String(canvas.scrollHeight))

    const cr = canvas.getBoundingClientRect()
    const paths: string[] = []

    function addLine(parentId: string, childId: string) {
      const pe = canvas!.querySelector<HTMLElement>(`[data-id="${parentId}"]`)
      const ce = canvas!.querySelector<HTMLElement>(`[data-id="${childId}"]`)
      if (!pe || !ce) return
      const pr = pe.getBoundingClientRect()
      const cer = ce.getBoundingClientRect()
      const px = pr.left + pr.width / 2 - cr.left + canvas!.scrollLeft
      const py = pr.top + pr.height - cr.top + canvas!.scrollTop
      const cx = cer.left + cer.width / 2 - cr.left + canvas!.scrollLeft
      const cy = cer.top - cr.top + canvas!.scrollTop
      const my = (py + cy) / 2
      paths.push(`M ${px} ${py} C ${px} ${my}, ${cx} ${my}, ${cx} ${cy}`)
    }

    members.forEach(m => {
      if (m.parent_id) addLine(m.parent_id, m.id)
      if (m.parent2_id) addLine(m.parent2_id, m.id)
    })

    svg.innerHTML = paths.map(d =>
      `<path d="${d}" fill="none" stroke="var(--line-color,#d0d0ce)" stroke-width="1.5"/>`
    ).join('')
  }, [members])

  useEffect(() => { requestAnimationFrame(drawLines) }, [members, drawLines])
  useEffect(() => {
    window.addEventListener('resize', drawLines)
    return () => window.removeEventListener('resize', drawLines)
  }, [drawLines])

  async function handleSave(data: Partial<Member>, meta: { alsoParentOfIds: string[] }) {
    if (modal?.mode === 'edit') {
      const { data: updated } = await supabase
        .from('members').update(data).eq('id', modal.member.id).select().single()
      if (updated) setMembers(ms => ms.map(m => m.id === updated.id ? updated : m))
    } else if (modal?.mode === 'add') {
      const { addAs, anchorMember } = modal

      let newParentId: string | null = null
      let newParent2Id: string | null = data.parent2_id ?? null
      let newSpouseOf: string | null = null

      if (addAs === 'child') {
        newParentId = anchorMember?.id ?? null
        // newParent2Id comes from "also child of" selection in modal
      } else if (addAs === 'sibling') {
        newParentId = anchorMember?.parent_id ?? null
        newParent2Id = anchorMember?.parent2_id ?? null  // auto-inherit both parents
      } else if (addAs === 'parent') {
        newParentId = anchorMember?.parent_id ?? null  // chain insertion
        newParent2Id = null
      } else if (addAs === 'spouse') {
        newSpouseOf = anchorMember?.id ?? null
        // newParent2Id from "also child of" if selected
      }
      // root: all stay at their data/null values

      // Exclude parent2_id from data spread — we set it explicitly above
      const { parent2_id: _p2, ...insertFields } = data

      const { data: created } = await supabase
        .from('members')
        .insert({ ...insertFields, family_id: family.id, parent_id: newParentId, parent2_id: newParent2Id, spouse_of: newSpouseOf })
        .select().single()

      if (created) {
        let updatedMembers = [...members, created]

        if (addAs === 'parent' && anchorMember) {
          // Point anchor to new parent (use parent2_id slot if parent1 is already taken)
          if (!anchorMember.parent_id) {
            await supabase.from('members').update({ parent_id: created.id }).eq('id', anchorMember.id)
            updatedMembers = updatedMembers.map(m =>
              m.id === anchorMember.id ? { ...m, parent_id: created.id } : m
            )
          } else if (!anchorMember.parent2_id) {
            await supabase.from('members').update({ parent2_id: created.id }).eq('id', anchorMember.id)
            updatedMembers = updatedMembers.map(m =>
              m.id === anchorMember.id ? { ...m, parent2_id: created.id } : m
            )
          }
        }

        // "Also parent of" — update each selected existing member's free parent slot
        for (const targetId of meta.alsoParentOfIds) {
          const target = members.find(m => m.id === targetId)
          if (!target) continue
          if (!target.parent_id) {
            await supabase.from('members').update({ parent_id: created.id }).eq('id', targetId)
            updatedMembers = updatedMembers.map(m => m.id === targetId ? { ...m, parent_id: created.id } : m)
          } else if (!target.parent2_id) {
            await supabase.from('members').update({ parent2_id: created.id }).eq('id', targetId)
            updatedMembers = updatedMembers.map(m => m.id === targetId ? { ...m, parent2_id: created.id } : m)
          }
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
      mode: 'add', addAs: 'root', anchorMember: null, isSelfAdd: true,
      prefill: { name: userProfile?.full_name ?? '', photo_url: userProfile?.avatar_url ?? null },
    })
  }

  function openRelModal(addAs: AddAs) {
    setShowRelPicker(false)
    setModal({ mode: 'add', addAs, anchorMember: selected })
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

  // Compute "also link" options for the modal
  let alsoChildOfOptions: { id: string; name: string }[] = []
  let alsoParentOfOptions: { id: string; name: string }[] = []

  if (modal?.mode === 'add') {
    const anchor = modal.anchorMember

    // "Also child of" — sets parent2_id on the new member
    // Not shown for 'sibling' (auto-inherits) or 'parent' (chain insertion)
    if (modal.addAs !== 'sibling' && modal.addAs !== 'parent') {
      const excludeIds = new Set<string>()
      if (anchor) {
        excludeIds.add(anchor.id)
        getDescendants(anchor.id).forEach(id => excludeIds.add(id))
      }
      const candidates = members.filter(m => !excludeIds.has(m.id))
      // Sort anchor's spouses to the top (most likely co-parent)
      const spouseIds = anchor
        ? new Set(members.filter(s => s.spouse_of === anchor.id || anchor.spouse_of === s.id).map(s => s.id))
        : new Set<string>()
      alsoChildOfOptions = [
        ...candidates.filter(m => spouseIds.has(m.id)),
        ...candidates.filter(m => !spouseIds.has(m.id)),
      ].map(m => ({ id: m.id, name: m.name }))
    }

    // "Also parent of" — new member becomes a parent of existing members
    // Available for all addAs types; exclude anchor and anchor's ancestors
    const excludeForParent = new Set<string>()
    if (anchor) {
      excludeForParent.add(anchor.id)
      // Walk up parent_id chain
      let cur: Member | undefined = anchor
      const seen = new Set<string>()
      while (cur?.parent_id && !seen.has(cur.parent_id)) {
        excludeForParent.add(cur.parent_id)
        seen.add(cur.parent_id)
        cur = members.find(m => m.id === cur!.parent_id)
      }
      // Also exclude immediate parent2 of anchor
      if (anchor.parent2_id) excludeForParent.add(anchor.parent2_id)
    }
    alsoParentOfOptions = members
      .filter(m => !excludeForParent.has(m.id) && (!m.parent_id || !m.parent2_id))
      .map(m => ({ id: m.id, name: m.name }))
  }

  const gens = buildGens()
  const isEmpty = gens.length === 0

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
          {/* Header add button only shown for empty trees — prevents orphans */}
          {canEdit && isEmpty && (
            <button className="btn-primary"
              onClick={() => setModal({ mode: 'add', addAs: 'root', anchorMember: null })}>
              + Add member
            </button>
          )}
        </div>
      </header>

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

          {isEmpty ? (
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
                  const spouses = members.filter(s => s.spouse_of === m.id)
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <MemberCard m={m} selectedId={selectedId} userMemberId={userMemberId}
                        onSelect={id => setSelectedId(prev => prev === id ? null : id)}
                        animDelay={gi * 60} />
                      {spouses.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                          <div className="spouse-connector" />
                          <MemberCard m={s} selectedId={selectedId} userMemberId={userMemberId}
                            onSelect={id => setSelectedId(prev => prev === id ? null : id)}
                            animDelay={gi * 60} />
                        </div>
                      ))}
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
              {userId && !selfInTree && (
                <button className="btn-ghost" onClick={handleThisIsMe}>This is me</button>
              )}
              {canEdit && (
                <>
                  {showRelPicker ? (
                    <div className="rel-picker">
                      <button
                        className="rel-picker-btn"
                        onClick={() => openRelModal('parent')}
                        disabled={!!(selected.parent_id && selected.parent2_id)}
                        title={selected.parent_id && selected.parent2_id ? 'Already has 2 parents' : undefined}
                      >
                        ↑ Parent
                      </button>
                      <button className="rel-picker-btn" onClick={() => openRelModal('child')}>↓ Child</button>
                      <button className="rel-picker-btn" onClick={() => openRelModal('sibling')}>↔ Sibling</button>
                      <button className="rel-picker-btn" onClick={() => openRelModal('spouse')}>♡ Spouse</button>
                    </div>
                  ) : (
                    <button className="btn-ghost" onClick={() => setShowRelPicker(true)}>
                      + Add relative
                    </button>
                  )}
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
          alsoChildOfOptions={modal.mode === 'add' ? alsoChildOfOptions : undefined}
          alsoParentOfOptions={modal.mode === 'add' ? alsoParentOfOptions : undefined}
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
