import { connectDB } from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    
    let query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }
    
    const coupons = await Coupon.find(query).sort({ createdAt: -1 });
    
    return Response.json(coupons, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('Coupon fetch error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    const { code, bonusAmount, maxUsage, description } = await request.json();
    
    if (!code || !bonusAmount) {
      return Response.json({ message: 'Code and bonus amount are required' }, { status: 400 });
    }
    
    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return Response.json({ message: 'Coupon code already exists' }, { status: 400 });
    }
    
    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      bonusAmount: parseFloat(bonusAmount),
      maxUsage: maxUsage ? parseInt(maxUsage) : null,
      description: description || '',
      isActive: true,
      usageCount: 0,
      usedBy: []
    });
    
    return Response.json(coupon);
    
  } catch (error) {
    console.error('Coupon creation error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const { couponId, action, ...updateData } = await request.json();
    
    if (!couponId || !action) {
      return Response.json({ message: 'Coupon ID and action are required' }, { status: 400 });
    }
    
    let coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return Response.json({ message: 'Coupon not found' }, { status: 404 });
    }
    
    switch (action) {
      case 'toggle':
        coupon.isActive = !coupon.isActive;
        break;
        
      case 'update':
        Object.assign(coupon, updateData);
        break;
        
      default:
        return Response.json({ message: 'Invalid action' }, { status: 400 });
    }
    
    await coupon.save();
    
    return Response.json(coupon);
    
  } catch (error) {
    console.error('Coupon update error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('id');
    
    if (!couponId) {
      return Response.json({ message: 'Coupon ID is required' }, { status: 400 });
    }
    
    const coupon = await Coupon.findByIdAndDelete(couponId);
    
    if (!coupon) {
      return Response.json({ message: 'Coupon not found' }, { status: 404 });
    }
    
    return Response.json({ message: 'Coupon deleted successfully' });
    
  } catch (error) {
    console.error('Coupon deletion error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
} 