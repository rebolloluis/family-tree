export type Member = {
  id: string
  family_id: string
  parent_id: string | null
  parent2_id: string | null
  spouse_of: string | null
  name: string
  born: number | null
  died: number | null
  relation: string | null
  note: string | null
  photo_url: string | null
  created_by: string | null
  created_at: string
}

export type Family = {
  id: string
  name: string
  description: string | null
  owner_id: string
  created_at: string
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  member_id: string | null
}
