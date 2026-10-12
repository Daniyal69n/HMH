import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import SystemSettings from '@/models/SystemSettings';
import Transaction from '@/models/Transaction';

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

    const cycleState = await SystemSettings.findOne({ key: 'mystery_box_cycle' });
    if (!cycleState || !cycleState.value || !cycleState.value.winners) {
      return Response.json({ message: 'No active cycle found' }, { status: 400 });
    }

    const winners = cycleState.value.winners;
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    const phoneSuffix = cleanPhone.slice(-10);
    const winnerIndex = winners.findIndex(w => {
      const wClean = String(w.phone || '').replace(/[^0-9]/g, '');
      return w.phone === phone || (wClean.length >= 10 && cleanPhone.length >= 10 && wClean.slice(-10) === phoneSuffix);
    });
    
    if (winnerIndex === -1) {
      return Response.json({ message: 'You did not win the previous cycle' }, { status: 400 });
    }
    
    const winner = winners[winnerIndex];
    
    if (winner.claimed) {
      return Response.json({ message: 'Reward already claimed' }, { status: 400 });
    }

    // Check if claim window has expired (12:00 AM midnight PKT)
    const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
    const getPktClaimDeadline = (dateInput) => {
      const d = new Date(dateInput);
      const pktTime = new Date(d.getTime() + PKT_OFFSET_MS);
      const year = pktTime.getUTCFullYear();
      const month = pktTime.getUTCMonth();
      const date = pktTime.getUTCDate();
      const deadlineUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0) - PKT_OFFSET_MS;
      return new Date(deadlineUtcMs);
    };

    let claimDeadline = cycleState.value.claimDeadline ? new Date(cycleState.value.claimDeadline) : null;
    if (!claimDeadline) {
      const endedAt = cycleState.value.cycleEndedAt || cycleState.updatedAt || new Date();
      claimDeadline = getPktClaimDeadline(endedAt);
    }

    if (Date.now() > claimDeadline.getTime()) {
      return Response.json({
        message: 'Claim period has expired. Prizes had to be claimed before 12:00 AM.'
      }, { status: 400 });
    }

    // Award cash prize based on rank
    let rewardAmount = 0;
    if (winner.rank === 1) rewardAmount = 100;
    else if (winner.rank === 2) rewardAmount = 50;
    else if (winner.rank === 3) rewardAmount = 25;
    
    // Convert USD to PKR (assuming 1 USD = 300 PKR for internal storage consistency)
    const pkrRewardAmount = rewardAmount * 300;

    user.balance += pkrRewardAmount;
    user.earnBalance += pkrRewardAmount;
    
    if (user.customTotalEarnings !== undefined && user.customTotalEarnings !== null) {
      user.customTotalEarnings += pkrRewardAmount;
    }
    
    await user.save();
    
    // Mark as claimed
    winners[winnerIndex].claimed = true;
    cycleState.markModified('value.winners');
    await cycleState.save();

    // Create transaction record
    try {
      await Transaction.create({
        userId: user.phone,
        userName: user.name || 'User',
        type: 'mystery_box_reward',
        amount: pkrRewardAmount,
        status: 'approved',
        description: `Mystery Box Rank ${winner.rank} Cash Prize ($${rewardAmount})`,
        transactionId: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
      });
    } catch (txErr) {
      console.warn('Failed to record mystery box transaction:', txErr.message);
    }

    return Response.json({
      message: 'Mystery Box claimed successfully',
      rewardAmount: pkrRewardAmount,
      usdRewardAmount: rewardAmount,
      newBalance: user.balance,
      newEarnBalance: user.earnBalance,
      newTotalEarnings: user.totalCommissionEarned
    }, { status: 200 });

  } catch (error) {
    console.error('Claim Mystery Box Error:', error);
    return Response.json({ message: 'Error claiming reward', error: error.message }, { status: 500 });
  }
}
