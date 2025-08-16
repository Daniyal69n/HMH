import { connectDB } from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    
    const { couponCode, userId } = await request.json();
    
    if (!couponCode || !userId) {
      return Response.json({ message: 'Coupon code and user ID are required' }, { status: 400 });
    }
    
    // Find the coupon
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    
    if (!coupon) {
      return Response.json({ message: 'Invalid coupon code' }, { status: 404 });
    }
    
    if (!coupon.isActive) {
      return Response.json({ message: 'This coupon code is inactive' }, { status: 400 });
    }
    
    if (!coupon.canBeUsed()) {
      return Response.json({ message: 'This coupon has reached its usage limit' }, { status: 400 });
    }
    
    // Check if user has already used this coupon
    const hasUsed = coupon.usedBy.some(usage => usage.userId === userId);
    if (hasUsed) {
      return Response.json({ message: 'You have already used this coupon code' }, { status: 400 });
    }
    
    // Find the user
    const user = await User.findOne({ phone: userId });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Use the coupon
    await coupon.use(userId);
    
    // Update user balances - add to both earn balance and account balance
    const currentBalance = typeof user.balance === 'number' ? user.balance : 0;
    const currentEarnBalance = typeof user.earnBalance === 'number' ? user.earnBalance : 0;
    
    const newBalance = currentBalance + coupon.bonusAmount;
    const newEarnBalance = currentEarnBalance + coupon.bonusAmount;
    
    await User.findOneAndUpdate(
      { phone: userId },
      { 
        balance: newBalance,
        earnBalance: newEarnBalance
      }
    );
    
    // Create transaction record
    await Transaction.create({
      userId: userId,
      type: 'coupon_redeem',
      amount: coupon.bonusAmount,
      status: 'completed',
      description: `Coupon redemption: ${coupon.code}`,
      couponCode: coupon.code,
      transactionId: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
    });
    
    return Response.json({
      message: 'Coupon redeemed successfully',
      bonusAmount: coupon.bonusAmount,
      newBalance: newBalance,
      newEarnBalance: newEarnBalance
    });
    
  } catch (error) {
    console.error('Coupon redemption error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
} 