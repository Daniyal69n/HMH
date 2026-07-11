import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.collection.find().sort({ createdAt: -1 }).toArray();
    return Response.json(products);
  } catch (error) {
    return Response.json({ message: 'Error fetching products', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, description, price, currency, image, images, isActive } = body;

    if (!name || !price) {
      return Response.json({ message: 'Name and price are required' }, { status: 400 });
    }

    const product = await Product.create({
      name,
      description,
      price,
      currency: currency || 'Rs',
      image: image || '',
      images: images || (image ? [image] : []),
      isActive: isActive !== undefined ? isActive : true
    });

    return Response.json({ message: 'Product created successfully', product }, { status: 201 });
  } catch (error) {
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
