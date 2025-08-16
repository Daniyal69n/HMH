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
    console.error('Error fetching images:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch images' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const { imageName, imageData, imageType } = await request.json();
    
    if (!imageName || !imageData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image name and data are required' 
      }, { status: 400 });
    }
    
    // Get existing images
    const existingImages = await SystemSettings.getSetting('carouselImages') || {};
    
    // Update the specific image
    const updatedImages = {
      ...existingImages,
      [imageName]: {
        data: imageData,
        type: imageType || 'image/jpeg',
        uploadedAt: new Date().toISOString()
      }
    };
    
    // Save to database
    await SystemSettings.setSetting('carouselImages', updatedImages, 'Carousel images for investment plans');
    
    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      imageName
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload image' 
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
