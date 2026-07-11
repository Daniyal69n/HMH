import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    return Response.json(products);
  } catch (error) {
    return Response.json({ message: 'Error fetching products', error: error.message }, { status: 500 });
  }
}
