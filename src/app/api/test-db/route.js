import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    await connectDB();
    
    return Response.json({ 
      message: 'MongoDB connection successful',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('MongoDB test failed:', error.message);
    console.error('Full error:', error);
    
    return Response.json({ 
      message: 'MongoDB connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 