import AuthForm from '@/components/auth-form'

export const metadata = { title: 'Create account — Family Tree' }

export default function SignupPage() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start building your family tree</p>
        <AuthForm mode="signup" />
      </div>
    </main>
  )
}
