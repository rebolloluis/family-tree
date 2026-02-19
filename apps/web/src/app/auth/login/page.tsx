import AuthForm from '@/components/auth-form'

export const metadata = { title: 'Sign in — Family Tree' }

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your account</p>
        <AuthForm mode="login" />
      </div>
    </main>
  )
}
