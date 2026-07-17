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
    const referrals = await User.find({ referredBy: phone, 'investmentPlans.status': 'active' }).select('-profilePicture -investmentPlans.screenshotData').lean();
    
    let pools = {
      basic: [], standard: [], diamond: [], pro: [], premium: [], legend: [], other: []
    };
    
    for (const m of referrals) {
      const activePlan = (m.investmentPlans || []).reverse().find(p => p.status === 'active');
      const planName = activePlan ? activePlan.planName.toLowerCase().trim() : 'free';
      if (pools[planName]) pools[planName].push(m);
      else pools.other.push(m);
    }
    
    const consumeAny = (count) => {
      let consumed = 0;
      const order = ['other', 'basic', 'standard', 'diamond', 'pro', 'premium', 'legend'];
      for (const p of order) {
        while (pools[p].length > 0 && consumed < count) {
          pools[p].pop();
          consumed++;
        }
      }
      return consumed;
    }

    const consumeSpecific = (plan, count) => {
      let consumed = 0;
      while (pools[plan] && pools[plan].length > 0 && consumed < count) {
        pools[plan].pop();
        consumed++;
      }
      return consumed;
    }
    
    let isEligible = false;
    let rewardUSD = 0;
    
    for (let lv = 1; lv <= level; lv++) {
      if (lv === 1) {
        rewardUSD = 2;
        const count = consumeAny(5);
        if (lv === level) isEligible = count >= 5;
      } else if (lv === 2) {
        rewardUSD = 5;
        const count = consumeAny(10);
        if (lv === level) isEligible = count >= 10;
      } else {
        let reqEach = 0;
        if (lv === 3) {
          reqEach = 2;
          rewardUSD = 10;
        } else if (lv === 4) {
          reqEach = 3;
          rewardUSD = 15;
        } else if (lv === 5) {
          reqEach = 4;
          rewardUSD = 20;
        } else {
          reqEach = 5;
          rewardUSD = 25 + (lv - 6) * 5;
        }
        
        const basicProgress = consumeSpecific('basic', reqEach);
        const standardProgress = consumeSpecific('standard', reqEach);
        const diamondProgress = consumeSpecific('diamond', reqEach);
        const proProgress = consumeSpecific('pro', reqEach);
        const premiumProgress = consumeSpecific('premium', reqEach);
        const legendProgress = consumeSpecific('legend', reqEach);

        if (lv === level) {
          isEligible = (
            basicProgress >= reqEach &&
            standardProgress >= reqEach &&
            diamondProgress >= reqEach &&
            proProgress >= reqEach &&
            premiumProgress >= reqEach &&
            legendProgress >= reqEach
          );
        }
      }
    }
    
    if (!isEligible) {
      return Response.json({ message: `You do not meet the conditions for Level ${level} yet` }, { status: 400 });
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
    user.totalCommissionEarned = (user.totalCommissionEarned || 0) + rewardPKR + levelSalaryPKR;
    
    // 3. Current balance (balance) gets the standard level reward
    user.balance = (user.balance || 0) + rewardPKR;

    // 4. Milestone Check: If milestone level is reached (10, 20, 30, 40, 50), 
    // move the entire accumulated block salary to the withdrawable current balance.
    if (level === 10) {
      user.balance += 100 * PKR_RATE; // $100 salary to balance
    } else if (level === 20) {
      user.balance += 200 * PKR_RATE; // $200 salary to balance
    } else if (level === 30) {
      user.balance += 300 * PKR_RATE; // $300 salary to balance
    } else if (level === 40) {
      user.balance += 400 * PKR_RATE; // $400 salary to balance
    } else if (level === 50) {
      user.balance += 500 * PKR_RATE; // $500 salary to balance
    }
    
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
      paymentMethod: 'bank', // match enum schema options where applicable or omit
      status: 'completed',   // level rewards are immediately approved/completed
      description: `Level ${level} Completion Reward`,
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
