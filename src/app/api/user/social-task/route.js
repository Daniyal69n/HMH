import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, link, platform } = body;
    
    if (!phone) {
      return Response.json({ message: 'Phone number is required' }, { status: 400 });
    }

    if (!link || !platform) {
      return Response.json({ message: 'Link and platform are required' }, { status: 400 });
    }

    // Validate link belongs to the selected platform
    const linkLower = link.toLowerCase();
    const platformLower = platform.toLowerCase();
    
    if (platformLower === 'youtube' && !linkLower.includes('youtube.com') && !linkLower.includes('youtu.be')) {
      return Response.json({ message: 'Invalid link. Please provide a valid YouTube link.' }, { status: 400 });
    }
    if (platformLower === 'instagram' && !linkLower.includes('instagram.com')) {
      return Response.json({ message: 'Invalid link. Please provide a valid Instagram link.' }, { status: 400 });
    }
    if (platformLower === 'tiktok' && !linkLower.includes('tiktok.com')) {
      return Response.json({ message: 'Invalid link. Please provide a valid TikTok link.' }, { status: 400 });
    }
    if (platformLower === 'facebook' && !linkLower.includes('facebook.com') && !linkLower.includes('fb.watch') && !linkLower.includes('fb.com')) {
      return Response.json({ message: 'Invalid link. Please provide a valid Facebook link.' }, { status: 400 });
    }

    // Check globally if this exact link has already been submitted by anyone
    const existingLinkUser = await User.findOne({ submittedSocialLinks: link });
    if (existingLinkUser) {
      return Response.json({ message: 'This link has already been submitted. Please upload a new link.' }, { status: 400 });
    }
    
    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Calculate today at 12:00 AM PKT (UTC+5)
    const now = new Date();
    const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    pktTime.setUTCHours(0, 0, 0, 0);
    const startOfToday = new Date(pktTime.getTime() - 5 * 60 * 60 * 1000);

    // Check if the user has already completed a task today
    const existingTxn = await Transaction.findOne({
      userId: user.phone,
      type: 'social_task_reward',
      createdAt: { $gte: startOfToday }
    });
    
    if (existingTxn) {
      return Response.json({ message: 'You have already completed the social task for today. Please try again after 12:00 AM.' }, { status: 400 });
    }
    
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
    
    // Credit reward only to my rewards (totalCommissionEarned)
    // The dashboard automatically calculates Total Earnings as earnBalance + totalCommissionEarned
    user.totalCommissionEarned = (user.totalCommissionEarned || 0) + rewardPKR;
    
    // Create corresponding transaction log
    const txnId = `TXN-SOCIAL-${Date.now()}`;
    await Transaction.create({
      transactionId: txnId,
      userId: user.phone,
      userName: user.name,
      userPhone: user.phone,
      amount: rewardPKR,
      type: 'social_task_reward',
      status: 'completed',
      description: `Social Task Completion Reward ($${rewardUSD})`,
      createdAt: new Date()
    });
    
    // Save the submitted link
    if (!user.submittedSocialLinks) {
      user.submittedSocialLinks = [];
    }
    user.submittedSocialLinks.push(link);
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
