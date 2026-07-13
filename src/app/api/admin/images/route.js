import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SystemSettings from '@/models/SystemSettings';

export async function GET() {
  try {
    await connectDB();
    
    // Get all stored images
    const images = await SystemSettings.getSetting('carouselImages');
    
    return NextResponse.json({
      success: true,
      images: images || {}
    });
  } catch (error) {
    console.warn('Error fetching images (offline mode):', error.message);
    return NextResponse.json({ 
      success: true, 
      images: {} 
    });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const { imageName, imageUrl } = await request.json();
    
    if (!imageName || !imageUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image name and Cloudinary URL are required' 
      }, { status: 400 });
    }

    // Validate it's a URL (not base64)
    if (!imageUrl.startsWith('http')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image must be a Cloudinary URL (not base64)' 
      }, { status: 400 });
    }
    
    // Get existing images
    const existingImages = await SystemSettings.getSetting('carouselImages') || {};
    
    // Update the specific image - STORE ONLY URL, NOT BASE64
    const updatedImages = {
      ...existingImages,
      [imageName]: {
        url: imageUrl,
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Save to database
    await SystemSettings.setSetting('carouselImages', updatedImages, 'Carousel images for investment plans');
    
    return NextResponse.json({
      success: true,
      message: 'Image URL saved successfully',
      imageName,
      imageUrl
    });
  } catch (error) {
    console.error('Error saving image URL:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save image URL' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const imageName = searchParams.get('imageName');
    
    if (!imageName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image name is required' 
      }, { status: 400 });
    }
    
    // Get existing images
    const existingImages = await SystemSettings.getSetting('carouselImages') || {};
    
    // Remove the specific image
    const { [imageName]: removed, ...updatedImages } = existingImages;
    
    // Save to database
    await SystemSettings.setSetting('carouselImages', updatedImages, 'Carousel images for investment plans');
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      imageName
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete image' 
    }, { status: 500 });
  }
}
