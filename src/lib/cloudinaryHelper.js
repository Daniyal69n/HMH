/**
 * Cloudinary Helper
 * Automatically uploads base64 image strings to Cloudinary and returns CDN URLs
 */

export async function uploadBase64ToCloudinary(imageBase64, folder = 'plan-requests') {
  if (!imageBase64 || typeof imageBase64 !== 'string') return null;
  
  // If it's already an HTTP / HTTPS URL, return as-is
  if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) {
    return imageBase64;
  }
  
  if (!imageBase64.startsWith('data:image')) {
    return null;
  }

  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.warn('Cloudinary env credentials not available');
      return null;
    }

    const formData = new FormData();
    formData.append('file', imageBase64);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      return data.secure_url || data.url || null;
    }
  } catch (err) {
    console.error('Error uploading base64 to Cloudinary:', err);
  }
  return null;
}
