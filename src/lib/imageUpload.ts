import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadImage(file: File, bucket: string = 'evidence'): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { url: '', error: 'Please select a valid image file' };
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      return { url: '', error: 'Image size must be less than 2MB' };
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomSuffix}.${fileExtension}`;

    // Upload to Supabase Storage
    // Create a promise that rejects after 30 seconds to prevent hanging
    const uploadPromise = supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Upload timed out')), 30000)
    );

    const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

    if (error) {
      console.error('Supabase storage upload error:', error);
      // Check for specific error codes if possible, or give a helpful message
      if (error.message?.includes('Bucket not found')) {
        return { url: '', error: 'Storage bucket not found. Please contact support.' };
      }
      return { url: '', error: error.message || 'Failed to upload image' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select a valid image file (JPG, PNG, GIF)' };
  }

  // Check file size (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size must be less than 2MB' };
  }

  // Check allowed formats
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Please use JPG, PNG, GIF, or WebP format' };
  }

  return { isValid: true };
}

/**
 * Create a preview URL for the selected file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Cleanup preview URL to prevent memory leaks
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
