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

  let userMemberId: string | null = null
  let userProfile: { full_name: string | null; avatar_url: string | null } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('member_id, full_name, avatar_url')
      .eq('id', user.id)
      .single()
    userMemberId = profile?.member_id ?? null
    userProfile = profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : null
  }

  return (
    <TreeCanvas
      family={family}
      initialMembers={members ?? []}
      canEdit={canEdit}
      userId={user?.id ?? null}
      userMemberId={userMemberId}
      userProfile={userProfile}
    />
  )
}
