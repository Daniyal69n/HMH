import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import SystemSettings from '@/models/SystemSettings';

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
    const winnerIndex = winners.findIndex(w => w.phone === phone);
    
    if (winnerIndex === -1) {
      return Response.json({ message: 'You did not win the previous cycle' }, { status: 400 });
    }
    
    const winner = winners[winnerIndex];
    
    if (winner.claimed) {
      return Response.json({ message: 'Reward already claimed' }, { status: 400 });
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
    user.totalCommissionEarned += pkrRewardAmount;
    
    if (user.customTotalEarnings !== undefined && user.customTotalEarnings !== null) {
      user.customTotalEarnings += pkrRewardAmount;
    }
    
    await user.save();
    
    // Mark as claimed
    winners[winnerIndex].claimed = true;
    cycleState.markModified('value.winners');
    await cycleState.save();

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
