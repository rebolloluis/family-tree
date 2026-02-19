import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TreeCanvas from '@/components/tree-canvas'

export default async function TreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: family } = await supabase
    .from('families')
    .select('id, name, description, owner_id')
    .eq('id', id)
    .single()

  if (!family) notFound()

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .eq('family_id', id)
    .order('created_at')

  const { data: { user } } = await supabase.auth.getUser()
  const canEdit = !!user && user.id === family.owner_id

  return (
    <TreeCanvas
      family={family}
      initialMembers={members ?? []}
      canEdit={canEdit}
    />
  )
}
