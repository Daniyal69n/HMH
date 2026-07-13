/**
 * Cloudinary Image Upload Helper
 * 
 * Setup Instructions:
 * 1. Sign up free at https://cloudinary.com
 * 2. Go to Dashboard to get your Cloud Name
 * 3. Create an unsigned upload preset: Settings > Upload > Upload presets > Create unsigned preset
 * 4. Add to .env.local:
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
 */

export async function uploadImageToCloudinary(file) {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error('Missing Cloudinary config. Add to .env.local');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!res.ok) {
      throw new Error('Cloudinary upload failed');
    }

    const data = await res.json();
    return data.secure_url; // Returns optimized HTTPS URL
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Upload base64 image string to Cloudinary
 */
export async function uploadBase64ToCloudinary(base64String) {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error('Missing Cloudinary config');
  }

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: JSON.stringify({
          file: base64String,
          upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ''
        }),
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!res.ok) {
      throw new Error('Upload failed');
    }

    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Delete image from Cloudinary
 * Note: Requires authenticated request with API key
 */
export function getCloudinaryImageUrl(publicId, options = {}) {
  const baseUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  const transformations = Object.entries(options)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return transformations ? `${baseUrl}/${transformations}/${publicId}` : `${baseUrl}/${publicId}`;
}
