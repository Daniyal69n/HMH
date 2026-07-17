import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    const { phone } = await request.json();

    if (!phone) {
      return Response.json({ message: 'Phone number is required' }, { status: 400 });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Calculate current streak
    const levelAMembers = await User.find({ referredBy: user.phone, 'investmentPlans.status': 'active' }).select('-profilePicture -investmentPlans.screenshotData').lean();
    const getLocalDayIndex = (dateVal) => {
      const d = new Date(dateVal);
      const localTime = d.getTime() + 5 * 60 * 60 * 1000; // PKT
      return Math.floor(localTime / (24 * 60 * 60 * 1000));
    }
    const activeDays = new Set();
    for (const m of levelAMembers) {
      activeDays.add(getLocalDayIndex(m.createdAt));
    }
    const todayDay = getLocalDayIndex(Date.now());
    let checkDay = todayDay;
    if (!activeDays.has(todayDay)) {
      checkDay = todayDay - 1;
    }
    let streak = 0;
    while (activeDays.has(checkDay)) {
      streak++;
      checkDay--;
    }

    const streakDays = Math.min(10, streak);

    if (streakDays < 10) {
      return Response.json({ message: 'Streak is not complete. You need a 10-day referral streak to claim this reward.' }, { status: 400 });
    }

    if (user.claimedStreakReward) {
      return Response.json({ message: 'You have already claimed your 10-day streak reward.' }, { status: 400 });
    }

    // Award $10 (Rs 3000)
    const rewardPKR = 10 * 300; // $10 converted to PKR

    user.balance = (user.balance || 0) + rewardPKR;
    user.earnBalance = (user.earnBalance || 0) + rewardPKR;
    if (user.customTotalEarnings !== undefined && user.customTotalEarnings !== null) {
      user.customTotalEarnings += rewardPKR;
    }
    user.claimedStreakReward = true;

    // Create a transaction log
    const txnId = `TXN-STREAK-${Date.now()}`;
    await Transaction.create({
      transactionId: txnId,
      userId: user.phone,
      userName: user.name,
      userPhone: user.phone,
      amount: rewardPKR,
      type: 'referral_income',
      status: 'completed',
      description: '10-Day Referral Streak Reward ($10)',
      createdAt: new Date()
    });

    await user.save();

    return Response.json({
      message: 'Congratulations! You claimed your $10 streak reward successfully.',
      claimedStreakReward: true,
      totalCommissionEarned: user.totalCommissionEarned,
      earnBalance: user.earnBalance,
      balance: user.balance
    });

  } catch (error) {
    console.error('Error claiming streak reward:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
