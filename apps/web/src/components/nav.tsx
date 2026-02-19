import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from './sign-out-button'

export default async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="nav">
      <Link href="/" className="nav-logo">
        Family <em>Tree</em>
      </Link>
      <nav className="nav-right">
        {user ? (
          <>
            <Link href="/dashboard" className="nav-link">My trees</Link>
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
