import { createClient } from './client'

export async function uploadFile(bucket: string, path: string, file: File): Promise<string> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
