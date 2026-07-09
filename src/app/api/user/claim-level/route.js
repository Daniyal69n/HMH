import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, level } = body;
    
    if (!phone || typeof level !== 'number' || level < 1 || level > 50) {
      return Response.json({ message: 'Invalid payload' }, { status: 400 });
    }
    
    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Check if already claimed
    if (user.claimedLevels && user.claimedLevels.includes(level)) {
      return Response.json({ message: `Level ${level} reward already claimed` }, { status: 400 });
    }
    
    // Fetch direct referrals (Level A) to verify conditions
    const referrals = await User.find({ referredBy: phone });
    
    const planCounts = {
      basic: 0,
      standard: 0,
      diamond: 0,
      pro: 0,
      premium: 0,
      legend: 0,
      any: 0
    };
    
    for (const m of referrals) {
      planCounts.any++;
      const activePlan = (m.investmentPlans || []).reverse().find(p => p.status === 'active');
      const planName = activePlan ? activePlan.planName.toLowerCase().trim() : 'free';
      if (planName === 'basic') planCounts.basic++;
      else if (planName === 'standard') planCounts.standard++;
      else if (planName === 'diamond') planCounts.diamond++;
      else if (planName === 'pro') planCounts.pro++;
      else if (planName === 'premium') planCounts.premium++;
      else if (planName === 'legend') planCounts.legend++;
    }
    
    let isEligible = false;
    let rewardUSD = 0;
    
    if (level === 1) {
      isEligible = planCounts.any >= 5;
      rewardUSD = 2;
    } else if (level === 2) {
      isEligible = planCounts.any >= 10;
      rewardUSD = 5;
    } else {
      let reqEach = 0;
      if (level === 3) {
        reqEach = 2;
        rewardUSD = 10;
      } else if (level === 4) {
        reqEach = 3;
        rewardUSD = 15;
      } else if (level === 5) {
        reqEach = 4;
        rewardUSD = 20;
      } else {
        reqEach = 5;
        rewardUSD = 25 + (level - 6) * 5;
      }
      isEligible = (
        planCounts.basic >= reqEach &&
        planCounts.standard >= reqEach &&
        planCounts.diamond >= reqEach &&
        planCounts.pro >= reqEach &&
        planCounts.premium >= reqEach &&
        planCounts.legend >= reqEach
      );
    }
    
    if (!isEligible) {
      return Response.json({ message: `You do not meet the conditions for Level ${level} yet` }, { status: 400 });
    }
    
    // Exchange rate is $1 = Rs 300
    const PKR_RATE = 300;
    const rewardPKR = rewardUSD * PKR_RATE;
    
    // Credit reward to:
    // 1. My rewards (totalCommissionEarned)
    // 2. Total earnings (earnBalance)
    // NOT in Current balance (balance)
    user.totalCommissionEarned = (user.totalCommissionEarned || 0) + rewardPKR;
    user.earnBalance = (user.earnBalance || 0) + rewardPKR;
    
    if (!user.claimedLevels) {
      user.claimedLevels = [];
    }
    user.claimedLevels.push(level);
    
    // Create corresponding transaction log
    const txnId = `TXN-LV-${level}-${Date.now()}`;
    await Transaction.create({
      transactionId: txnId,
      userId: user.phone,
      userName: user.name,
      userPhone: user.phone,
      amount: rewardPKR,
      type: 'level_reward',
      paymentMethod: 'system',
      status: 'approved',
      screenshot: '',
      createdAt: new Date()
    });
    
    await user.save();
    
    return Response.json({
      message: `Successfully claimed Level ${level} reward!`,
      balance: user.balance,
      earnBalance: user.earnBalance,
      totalCommissionEarned: user.totalCommissionEarned,
      claimedLevels: user.claimedLevels
    });
    
  } catch (error) {
    console.error('Claim level error:', error);
    return Response.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
