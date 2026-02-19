import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile-form'

export const metadata = { title: 'Profile — Family Tree' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <h1 className="auth-title">Your profile</h1>
        <p className="auth-sub" style={{ marginBottom: '0.5rem' }}>{user.email}</p>
        <ProfileForm profile={profile} />
      </div>
    </main>
  )
}
