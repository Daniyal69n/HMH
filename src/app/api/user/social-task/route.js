import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone } = body;
    
    if (!phone) {
      return Response.json({ message: 'Phone number is required' }, { status: 400 });
    }
    
    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Check if the user has already completed a task today?
    // The user didn't specify a daily limit, but usually there's a limit.
    // I will just process it as requested: "do nothing just when user click on submit after filling all fields he will be awarded"
    
    // Find active plan
    const activePlan = (user.investmentPlans || []).reverse().find(p => p.status === 'active');
    if (!activePlan) {
      return Response.json({ message: 'You must have an active plan to complete this task.' }, { status: 400 });
    }
    
    const planName = activePlan.planName.toLowerCase().trim();
    let rewardUSD = 0;
    
    if (planName === 'basic' || planName === 'standard') {
      rewardUSD = 1;
    } else if (planName === 'diamond' || planName === 'pro') {
      rewardUSD = 2;
    } else if (planName === 'premium' || planName === 'legend') {
      rewardUSD = 3;
    } else {
      return Response.json({ message: 'Your plan is not eligible for this task.' }, { status: 400 });
    }
    
    // Exchange rate is $1 = Rs 300
    const PKR_RATE = 300;
    const rewardPKR = rewardUSD * PKR_RATE;
    
    // Credit reward
    user.totalCommissionEarned = (user.totalCommissionEarned || 0) + rewardPKR;
    user.earnBalance = (user.earnBalance || 0) + rewardPKR;
    user.balance = (user.balance || 0) + rewardPKR;
    
    // Create corresponding transaction log
    const txnId = `TXN-SOCIAL-${Date.now()}`;
    await Transaction.create({
      transactionId: txnId,
      userId: user.phone,
      userName: user.name,
      userPhone: user.phone,
      amount: rewardPKR,
      type: 'social_task_reward',
      paymentMethod: 'system',
      status: 'completed',
      description: `Social Task Completion Reward ($${rewardUSD})`,
      createdAt: new Date()
    });
    
    await user.save();
    
    return Response.json({
      message: `Successfully completed task and earned $${rewardUSD}!`,
      balance: user.balance,
      earnBalance: user.earnBalance,
      totalCommissionEarned: user.totalCommissionEarned
    });
    
  } catch (error) {
    console.error('Social task error:', error);
    return Response.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
