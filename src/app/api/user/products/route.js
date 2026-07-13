import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    // Select only essential fields to keep response fast and small
    const products = await Product.find({ isActive: true })
      .select('name price currency image images _id createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .limit(50);
    
    // Filter out any base64 images (legacy data cleanup)
    const cleanedProducts = products.map(p => ({
      ...p,
      image: (p.image && p.image.startsWith('http')) ? p.image : '',
      images: Array.isArray(p.images) ? p.images.filter(img => typeof img === 'string' && img.startsWith('http')) : []
    }));
    
    return Response.json(cleanedProducts);
  } catch (error) {
    return Response.json([], { status: 200 });
  }
}
