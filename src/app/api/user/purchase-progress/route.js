import { connectDB } from '@/lib/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return Response.json({ message: 'Phone number required' }, { status: 400 });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Calculate total approved purchases
    const approvedOrders = await Order.find({ 
      userId: phone, 
      status: 'approved' 
    });
    
    const totalApprovedPurchases = approvedOrders.reduce((sum, order) => sum + order.amount, 0);
    
    // Update user's total approved purchases
    user.totalApprovedPurchases = totalApprovedPurchases;
    await user.save();

    const TARGET_AMOUNT = 15000;
    const claimedCount = user.purchaseRewardsClaimedCount || 0;
    const currentProgressAmount = Math.max(0, totalApprovedPurchases - (claimedCount * TARGET_AMOUNT));
    const progressPercentage = Math.min((currentProgressAmount / TARGET_AMOUNT) * 100, 100);

    return Response.json({
      totalApprovedPurchases,
      progressPercentage,
      targetAmount: TARGET_AMOUNT,
      hasClaimedReward: false // Allow infinite claiming
    }, { status: 200 });

  } catch (error) {
    console.error('Purchase Progress Error:', error);
    return Response.json({ message: 'Error fetching purchase progress', error: error.message }, { status: 500 });
  }
}
