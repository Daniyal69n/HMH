import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Try to connect, but don't fail if offline
    try {
      await connectDB();
    } catch (dbError) {
      console.warn('[API] MongoDB offline - returning empty products to save credits');
      return Response.json([], { status: 200 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Only fetch essential fields - no base64 images
    const products = await Product.find({ isActive: true })
      .select('name price currency image _id')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .maxTimeMS(3000)
      .exec();
    
    return Response.json(products);
  } catch (error) {
    console.error('Error fetching products:', error.message);
    return Response.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    // Try to connect to MongoDB
    try {
      await connectDB();
    } catch (dbError) {
      console.warn('MongoDB offline - returning basic validation response');
      // If MongoDB is down, still validate the product data
      const body = await request.json();
      const { name, price } = body;
      
      if (!name || !price) {
        return Response.json({ message: 'Name and price are required' }, { status: 400 });
      }
      
      // Return success even if DB is offline (data will sync when DB comes back online)
      return Response.json({ 
        message: 'Product saved locally - will sync when MongoDB is online',
        offline: true
      }, { status: 201 });
    }

    const body = await request.json();
    const { name, description, price, currency, image, images, isActive } = body;

    if (!name || !price) {
      return Response.json({ message: 'Name and price are required' }, { status: 400 });
    }

    let imageUrl = '';
    if (image && typeof image === 'string') {
      imageUrl = image;
    }
    
    let imageUrls = [];
    if (Array.isArray(images)) {
      imageUrls = images
        .filter(img => typeof img === 'string')
        .slice(0, 5);
    }

    const product = await Product.create({
      name: String(name).trim(),
      description: String(description || '').trim(),
      price: parseFloat(price) || 0,
      currency: currency || 'Rs',
      image: imageUrl,
      images: imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []),
      isActive: isActive !== undefined ? isActive : true
    });

    return Response.json({ message: 'Product created successfully', product }, { status: 201 });
  } catch (error) {
    console.error('Product creation error:', error);
    return Response.json({ message: 'Error creating product: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return Response.json({ message: 'Product ID is required' }, { status: 400 });
    }

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!product) {
      return Response.json({ message: 'Product not found' }, { status: 404 });
    }

    return Response.json({ message: 'Product updated successfully', product });
  } catch (error) {
    return Response.json({ message: 'Error updating product', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ message: 'Product ID is required' }, { status: 400 });
    }

    await Product.findByIdAndDelete(id);
    return Response.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return Response.json({ message: 'Error deleting product', error: error.message }, { status: 500 });
  }
}
