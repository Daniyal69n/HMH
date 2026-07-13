/**
 * User Order Receipt Image Upload
 * Upload receipt images to Cloudinary, returns URL
 * Frontend should call this BEFORE creating the order
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

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error('Missing Cloudinary config');
      return Response.json(
        { message: 'Cloudinary not configured' },
        { status: 500 }
      );
    }

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', imageBase64);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'order-receipts');  // Organize in folder

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json();
      console.error('Cloudinary upload failed:', errorData);
      return Response.json(
        { message: 'Upload failed' },
        { status: 500 }
      );
    }

    const data = await uploadRes.json();
    
    return Response.json({
      receiptUrl: data.secure_url,
      success: true
    }, { status: 200 });
  } catch (error) {
    console.error('Receipt image upload error:', error);
    return Response.json(
      { message: 'Failed to upload receipt image' },
      { status: 500 }
    );
  }
}
