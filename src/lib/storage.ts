/**
 * Supabase Storage Helper for file uploads
 */

import { supabase } from './supabase'

const STORAGE_BUCKET = 'supplier-images'

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param folder - Optional folder name
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  folder: string = 'images'
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase not configured')
    return null
  }

  try {
    // Create a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    console.log('✅ File uploaded:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('❌ Upload failed:', error)
    return null
  }
}

/**
 * Delete a file from Supabase Storage
 * @param url - The public URL of the file to delete
 */
export async function deleteFile(url: string): Promise<boolean> {
  if (!supabase) {
    return false
  }

  try {
    // Extract the path from the URL
    const urlObj = new URL(url)
    const path = urlObj.pathname.split(`/${STORAGE_BUCKET}/`)[1]

    if (!path) {
      console.warn('Invalid file URL')
      return false
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    console.log('✅ File deleted')
    return true
  } catch (error) {
    console.error('❌ Delete failed:', error)
    return false
  }
}

/**
 * Get the bucket name
 */
export function getBucketName(): string {
  return STORAGE_BUCKET
}
