import { connectDB } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Connecting via db-check...');
    const conn = await connectDB();
    const dbName = conn.connections[0].name;
    const collections = await conn.connections[0].db.listCollections().toArray();
    return Response.json({
      success: true,
      message: 'Database connected successfully!',
      dbName,
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    console.error('db-check failed:', error);
    return Response.json({
      success: false,
      message: 'Database connection failed!',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
