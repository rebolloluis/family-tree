import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: families } = await supabase
    .from('families')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <main className="home">
      <section className="hero">
        <h1 className="hero-title">Your family's story,<br /><em>together.</em></h1>
        <p className="hero-sub">
          Browse family trees, contribute to your own, or start a new one.
        </p>
        <Link href="/auth/signup" className="btn-primary hero-cta">
          Start your tree
        </Link>
      </section>

      <section className="families-section">
        <h2 className="section-title">Family trees</h2>
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
            <p>No trees yet. <Link href="/auth/signup">Be the first to start one.</Link></p>
          </div>
        )}
      </section>
    </main>
  )
}
