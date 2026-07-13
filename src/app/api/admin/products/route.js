import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      await connectDB();
      console.log('Fetching products from database...');
      const products = await Product.find({}).sort({ createdAt: -1 }).lean().maxTimeMS(10000);
      console.log(`Found ${products.length} products`);
      return Response.json(products);
    } catch (error) {
      lastError = error;
      console.error(`Error fetching products (retries left: ${retries - 1}):`, error.message);
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.error('Failed to fetch products after retries:', lastError);
  return Response.json({ 
    message: 'Error fetching products', 
    error: lastError?.message || 'Database connection failed' 
  }, { status: 500 });
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    console.log('Creating product with data:', body);
    const { name, description, price, currency, image, images, isActive } = body;

    if (!name || !price) {
      return Response.json({ message: 'Name and price are required' }, { status: 400 });
    }

    // Store only URLs, not Base64 strings - this keeps MongoDB fast
    const imageUrl = (image && typeof image === 'string' && image.startsWith('http')) ? image : '';
    const imageUrls = Array.isArray(images) 
      ? images.filter(img => typeof img === 'string' && img.startsWith('http'))
      : [];

    const product = await Product.create({
      name,
      description,
      price,
      currency: currency || 'Rs',
      image: imageUrl,
      images: imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []),
      isActive: isActive !== undefined ? isActive : true
    });

    console.log('Product created successfully:', product);
    return Response.json({ message: 'Product created successfully', product }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return Response.json({ message: 'Error creating product', error: error.message }, { status: 500 });
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
