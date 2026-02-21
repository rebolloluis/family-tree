// Seed script — creates the House Stark family tree in the remote Supabase DB.
// Uses service_role key to bypass RLS.
// Run: npx tsx scripts/seed-house-stark.ts

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://txronqardzjgqbkqkggx.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cm9ucWFyZHpqZ3Fia3FrZ2d4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ2MjI1OSwiZXhwIjoyMDg3MDM4MjU5fQ.72C3Y0AAnCf3bT_PoQyqH3LU1-_6AsgtRaImT9So20Y'

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seed() {
  // Find the first registered user
  const { data: users, error: userErr } = await db.auth.admin.listUsers()
  if (userErr || !users.users.length) {
    console.error('No users found. Register an account first.', userErr)
    process.exit(1)
  }
  const ownerId = users.users[0].id
  console.log(`Using owner: ${users.users[0].email} (${ownerId})`)

  // Ensure profile exists
  await db.from('profiles').upsert({ id: ownerId }, { onConflict: 'id' })

  // Create the family
  const { data: family, error: famErr } = await db
    .from('families')
    .insert({ name: 'House Stark', description: 'Winter is Coming', owner_id: ownerId })
    .select()
    .single()
  if (famErr || !family) { console.error('Failed to create family', famErr); process.exit(1) }
  const famId = family.id
  console.log(`Created family: ${famId}`)

  // Helper to insert a member and return its id
  async function addMember(fields: {
    name: string
    note?: string | null
    born?: number | null
    died?: number | null
    parent_id?: string | null
    parent2_id?: string | null
    spouse_of?: string | null
  }): Promise<string> {
    const { data, error } = await db
      .from('members')
      .insert({ family_id: famId, created_by: ownerId, ...fields })
      .select('id')
      .single()
    if (error || !data) { console.error(`Failed to insert ${fields.name}`, error); process.exit(1) }
    console.log(`  + ${fields.name}`)
    return data.id
  }

  console.log('\nGeneration 0: Rickard + Lady Stark')
  const rickardId = await addMember({ name: 'Rickard Stark', note: 'Lord of Winterfell' })
  const ladyId    = await addMember({ name: 'Lady Stark',    spouse_of: rickardId })

  console.log('\nGeneration 1: Rickard\'s children + their partners')
  const brandonId = await addMember({ name: 'Brandon Stark',       parent_id: rickardId, parent2_id: ladyId })
  const eddardId  = await addMember({ name: 'Eddard Stark',        note: 'Lord of Winterfell, Hand of the King', parent_id: rickardId, parent2_id: ladyId })
  const benjenId  = await addMember({ name: 'Benjen Stark',        note: "First Ranger, Night's Watch",           parent_id: rickardId, parent2_id: ladyId })
  const lyannaId  = await addMember({ name: 'Lyanna Stark',        parent_id: rickardId, parent2_id: ladyId })
  const catelynId = await addMember({ name: 'Catelyn Tully',       spouse_of: eddardId })
  const rhaegarId = await addMember({ name: 'Rhaegar Targaryen',   note: 'Crown Prince of the Seven Kingdoms', spouse_of: lyannaId })

  console.log('\nGeneration 2: Eddard+Catelyn\'s children and Lyanna+Rhaegar\'s child')
  await addMember({ name: 'Robb Stark',   note: 'King in the North',  parent_id: eddardId, parent2_id: catelynId })
  await addMember({ name: 'Sansa Stark',  parent_id: eddardId, parent2_id: catelynId })
  await addMember({ name: 'Arya Stark',   parent_id: eddardId, parent2_id: catelynId })
  await addMember({ name: 'Bran Stark',   note: 'Three-Eyed Raven',   parent_id: eddardId, parent2_id: catelynId })
  await addMember({ name: 'Rickon Stark', parent_id: eddardId, parent2_id: catelynId })
  await addMember({ name: 'Jon Snow',     note: 'King in the North',  parent_id: lyannaId, parent2_id: rhaegarId })

  // Suppress unused var warnings
  void brandonId; void benjenId

  console.log(`\nDone! Visit: ${SUPABASE_URL.replace('supabase.co', 'vercel.app')}/tree/${famId}`)
  console.log(`Or: http://localhost:3000/tree/${famId}`)
}

seed()
