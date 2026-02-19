import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CreateFamilyForm from '@/components/create-family-form'

export const metadata = { title: 'Dashboard — Family Tree' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: families } = await supabase
    .from('families')
    .select('id, name, description, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="home">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My trees</h1>
        <CreateFamilyForm />
      </div>

      {families && families.length > 0 ? (
        <div className="families-grid">
          {families.map(f => (
            <Link key={f.id} href={`/tree/${f.id}`} className="family-card">
              <div className="family-card-glyph">🌿</div>
              <div className="family-card-name">{f.name}</div>
              {f.description && <div className="family-card-desc">{f.description}</div>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-families">
          <span style={{ fontSize: '2rem', opacity: 0.2 }}>🌱</span>
          <p>No trees yet — create your first one above.</p>
        </div>
      )}
    </main>
  )
}
