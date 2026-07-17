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

    // Optimistic lock to prevent double-clicks
    const query = { phone };
    if (user.purchaseRewardsClaimedCount === undefined) {
      query.purchaseRewardsClaimedCount = { $exists: false };
    } else {
      query.purchaseRewardsClaimedCount = user.purchaseRewardsClaimedCount;
    }

    const lockedUser = await User.findOneAndUpdate(
      query,
      { $inc: { purchaseRewardsClaimedCount: 1 } },
      { new: true }
    );

    if (!lockedUser) {
      return Response.json({ message: 'Reward already claimed or processing.' }, { status: 409 });
    }

    // Award the $5 reward (converted to PKR)
    const REWARD_AMOUNT = 5;
    const rewardPKR = REWARD_AMOUNT * 300;
    lockedUser.balance = (lockedUser.balance || 0) + rewardPKR;
    lockedUser.earnBalance = (lockedUser.earnBalance || 0) + rewardPKR;
    
    if (lockedUser.customTotalEarnings !== undefined && lockedUser.customTotalEarnings !== null) {
      lockedUser.customTotalEarnings += rewardPKR;
    }
    
    // (Legacy field, keep it true just in case)
    lockedUser.hasClaimedPurchaseReward = true;
    
    await lockedUser.save();

    return Response.json({
      message: 'Reward claimed successfully',
      rewardAmount: REWARD_AMOUNT,
      newBalance: lockedUser.balance,
      newEarnBalance: lockedUser.earnBalance,
      newTotalEarnings: lockedUser.totalCommissionEarned
    }, { status: 200 });

  } catch (error) {
    console.error('Claim Reward Error:', error);
    return Response.json({ message: 'Error claiming reward', error: error.message }, { status: 500 });
  }
}
