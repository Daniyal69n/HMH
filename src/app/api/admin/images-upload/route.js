import { uploadBase64ToCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

/**
 * Image Upload Endpoint
 * Accepts base64 images and uploads to Cloudinary
 * Returns the secure URL for storing in database
 */
export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return Response.json(
        { message: 'Image data is required' },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const imageUrl = await uploadBase64ToCloudinary(imageBase64);

    return Response.json({
      message: 'Image uploaded successfully',
      imageUrl,
      success: true
    }, { status: 200 });
  } catch (error) {
    console.error('Image upload error:', error);
    return Response.json(
      { message: 'Failed to upload image', error: error.message },
      { status: 500 }
    );
  }
}
