import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

const inits = (n: string) =>
  n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

export default async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
    profile = data
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || ''

  return (
    <header className="nav">
      <Link href="/" className="nav-logo">
        Family <em>Tree</em>
      </Link>
      <nav className="nav-right">
        {user ? (
          <>
            <Link href="/dashboard" className="nav-link">My trees</Link>
            <Link href="/profile" className="nav-avatar" title="Profile">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} />
                : <span>{inits(displayName)}</span>}
            </Link>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/auth/login" className="nav-link">Sign in</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.45rem 0.9rem', borderRadius: '6px', textDecoration: 'none' }}>
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
