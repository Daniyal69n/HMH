import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { phone } = body;
    
    if (!phone) {
      return Response.json({ message: 'Phone number required' }, { status: 400 });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const TARGET_AMOUNT = 15000;
    const claimedCount = user.purchaseRewardsClaimedCount || 0;
    const currentProgressAmount = user.totalApprovedPurchases - (claimedCount * TARGET_AMOUNT);

    if (currentProgressAmount < TARGET_AMOUNT) {
      return Response.json({ 
        message: 'Target not reached yet', 
        currentAmount: currentProgressAmount,
        targetAmount: TARGET_AMOUNT 
      }, { status: 400 });
    }

    // Award the $5 reward (converted to PKR)
    const REWARD_AMOUNT = 5;
    const rewardPKR = REWARD_AMOUNT * 300;
    user.balance = (user.balance || 0) + rewardPKR;
    user.totalCommissionEarned = (user.totalCommissionEarned || 0) + rewardPKR;
    
    // Increment the claim count
    user.purchaseRewardsClaimedCount = claimedCount + 1;
    // (Legacy field, keep it true just in case)
    user.hasClaimedPurchaseReward = true;
    
    await user.save();

    return Response.json({
      message: 'Reward claimed successfully',
      rewardAmount: REWARD_AMOUNT,
      newBalance: user.balance,
      newEarnBalance: user.earnBalance,
      newTotalEarnings: user.totalCommissionEarned
    }, { status: 200 });

  } catch (error) {
    console.error('Claim Reward Error:', error);
    return Response.json({ message: 'Error claiming reward', error: error.message }, { status: 500 });
  }
}
