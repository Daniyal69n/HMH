import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { processSocialTaskMilestones } from '@/lib/socialTaskMilestoneHelper';

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
    const referrals = await User.find({ referredBy: phone, 'investmentPlans.status': 'active' }).select('investmentPlans.status investmentPlans.planName').lean();
    const pendingReferrals = await User.find({ referredBy: phone, 'investmentPlans.status': { $ne: 'active' } }).select('investmentPlans.status investmentPlans.planName').lean();
    
    const countA = (user.customDirectReferrals !== undefined && user.customDirectReferrals !== null) 
      ? user.customDirectReferrals 
      : (referrals.length + pendingReferrals.length);

    const availablePlans = ['basic', 'standard', 'diamond', 'pro', 'premium', 'legend'];
    let planCounts = {
      basic: 0, standard: 0, diamond: 0, pro: 0, premium: 0, legend: 0, other: 0
    };

    let totalCount = 0;
    for (const m of referrals) {
      const activePlan = (m.investmentPlans || []).reverse().find(p => p.status === 'active');
      const planName = activePlan ? activePlan.planName.toLowerCase().trim() : availablePlans[totalCount % availablePlans.length];
      if (planCounts[planName] !== undefined) planCounts[planName]++;
      else planCounts.other++;
      totalCount++;
    }

    for (const m of pendingReferrals) {
      if (totalCount >= countA) break;
      const planName = availablePlans[totalCount % availablePlans.length];
      if (planCounts[planName] !== undefined) planCounts[planName]++;
      else planCounts.other++;
      totalCount++;
    }

    while (totalCount < countA) {
      const planName = availablePlans[totalCount % availablePlans.length];
      if (planCounts[planName] !== undefined) planCounts[planName]++;
      else planCounts.other++;
      totalCount++;
    }
    
    let isEligible = false;
    let rewardUSD = 0;

    if (level === 1) {
      rewardUSD = 1;
      isEligible = totalCount >= 5;
    } else if (level === 2) {
      rewardUSD = 2;
      isEligible = totalCount >= 10;
    } else {
      const reqEach = level - 1;
      rewardUSD = level === 3 ? 10 : level === 4 ? 15 : level === 5 ? 20 : (25 + (level - 6) * 5);

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
    
    // Atomic check-and-lock to prevent race conditions / duplicate rapid claims
    const claimedUser = await User.findOneAndUpdate(
      { phone, claimedLevels: { $ne: level } },
      { $addToSet: { claimedLevels: level } },
      { new: true }
    );

    if (!claimedUser) {
      return Response.json({ message: `Level ${level} reward already claimed` }, { status: 400 });
    }

    // Exchange rate is $1 = Rs 300
    const PKR_RATE = 300;
    const rewardPKR = rewardUSD * PKR_RATE;
    
    // Calculate level salary based on current level block
    let levelSalaryUSD = 0;
    if (level >= 1 && level <= 10) levelSalaryUSD = 10;
    else if (level >= 11 && level <= 20) levelSalaryUSD = 20;
    else if (level >= 21 && level <= 30) levelSalaryUSD = 30;
    else if (level >= 31 && level <= 40) levelSalaryUSD = 40;
    else if (level >= 41 && level <= 50) levelSalaryUSD = 50;
    const levelSalaryPKR = levelSalaryUSD * PKR_RATE;
    
    // Credit reward and level salary to:
    // 1. My rewards (totalCommissionEarned)
    claimedUser.earnBalance = (claimedUser.earnBalance || 0) + rewardPKR + levelSalaryPKR;
    if (claimedUser.customTotalEarnings !== undefined && claimedUser.customTotalEarnings !== null) {
      claimedUser.customTotalEarnings += rewardPKR + levelSalaryPKR;
    }
    
    // 3. Current balance (balance) gets the standard level reward
    claimedUser.balance = (claimedUser.balance || 0) + rewardPKR;

    // 4. Milestone Check: If milestone level is reached (10, 20, 30, 40, 50), 
    // move the entire accumulated block salary to the withdrawable current balance.
    if (level === 10) {
      claimedUser.balance += 100 * PKR_RATE; // $100 salary to balance
    } else if (level === 20) {
      claimedUser.balance += 200 * PKR_RATE; // $200 salary to balance
    } else if (level === 30) {
      claimedUser.balance += 300 * PKR_RATE; // $300 salary to balance
    } else if (level === 40) {
      claimedUser.balance += 400 * PKR_RATE; // $400 salary to balance
    } else if (level === 50) {
      claimedUser.balance += 500 * PKR_RATE; // $500 salary to balance
    }
    
    if (!claimedUser.claimedLevels) {
      claimedUser.claimedLevels = [];
    }
    if (!claimedUser.claimedLevels.includes(level)) {
      claimedUser.claimedLevels.push(level);
    }
    
    // Evaluate if this new level unlocks a bulk payout for past social tasks
    await processSocialTaskMilestones(claimedUser);

    // Create corresponding transaction log
    const txnId = `TXN-LV-${level}-${Date.now()}`;
    await Transaction.create({
      transactionId: txnId,
      userId: claimedUser.phone,
      userName: claimedUser.name,
      userPhone: claimedUser.phone,
      amount: rewardPKR,
      type: 'level_reward',
      paymentMethod: 'bank', // match enum schema options where applicable or omit
      status: 'completed',   // level rewards are immediately approved/completed
      description: `Level ${level} Completion Reward`,
      createdAt: new Date()
    });
    
    await claimedUser.save();
    
    return Response.json({
      message: `Successfully claimed Level ${level} reward!`,
      balance: claimedUser.balance,
      earnBalance: claimedUser.earnBalance,
      totalCommissionEarned: claimedUser.totalCommissionEarned,
      claimedLevels: claimedUser.claimedLevels,
      rewardUSD,
      rewardPKR
    });
    
  } catch (error) {
    console.error('Claim level error:', error);
    return Response.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
