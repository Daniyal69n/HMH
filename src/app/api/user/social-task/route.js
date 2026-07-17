import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, link, platform, action } = body;
    
    if (!phone) {
      return Response.json({ message: 'Phone number is required' }, { status: 400 });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Find active plan
    const activePlan = (user.investmentPlans || []).reverse().find(p => p.status === 'active');
    if (!activePlan) {
      return Response.json({ message: 'You must have an active plan to complete this task.' }, { status: 400 });
    }

    // Calculate today's date string in PKT
    const now = new Date();
    const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const todayStr = pktTime.toISOString().split('T')[0];

    // Ensure socialTasks object exists
    let st = user.socialTasks || { date: '', tiktok: false, instagram: false, facebook: false, youtube: false, rewardClaimed: false };
    
    // Reset if it's a new day
    if (st.date !== todayStr) {
      st = { date: todayStr, tiktok: false, instagram: false, facebook: false, youtube: false, rewardClaimed: false };
    }

    if (action === 'claim_reward') {
      if (st.rewardClaimed) {
        return Response.json({ message: 'You have already collected the reward for today.' }, { status: 400 });
      }
      if (!st.tiktok || !st.instagram || !st.facebook || !st.youtube) {
        return Response.json({ message: 'You must complete all 4 tasks first.' }, { status: 400 });
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
      
      const PKR_RATE = 300;
      const rewardPKR = rewardUSD * PKR_RATE;
      
      user.totalCommissionEarned = (user.totalCommissionEarned || 0) + rewardPKR;
      st.rewardClaimed = true;
      user.socialTasks = st;
      
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
      
      await user.save();
      
      return Response.json({
        message: `Successfully completed all tasks and earned $${rewardUSD}!`,
        balance: user.balance,
        earnBalance: user.earnBalance,
        totalCommissionEarned: user.totalCommissionEarned,
        socialTasks: user.socialTasks
      });
    }

    // Otherwise, action is submit_link
    if (!link || !platform) {
      return Response.json({ message: 'Link and platform are required' }, { status: 400 });
    }

    const platformLower = platform.toLowerCase();
    
    // Check sequence
    if (platformLower === 'instagram' && !st.tiktok) {
      return Response.json({ message: 'You must complete the TikTok task first.' }, { status: 400 });
    }
    if (platformLower === 'facebook' && !st.instagram) {
      return Response.json({ message: 'You must complete the Instagram task first.' }, { status: 400 });
    }
    if (platformLower === 'youtube' && !st.facebook) {
      return Response.json({ message: 'You must complete the Facebook task first.' }, { status: 400 });
    }
    
    if (st[platformLower]) {
      return Response.json({ message: `You have already completed the ${platform} task today.` }, { status: 400 });
    }

    // Validate links
    const linkLower = link.toLowerCase();
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

    // Update status
    st[platformLower] = true;
    user.socialTasks = st;
    
    if (!user.submittedSocialLinks) {
      user.submittedSocialLinks = [];
    }
    user.submittedSocialLinks.push(link);
    await user.save();
    
    return Response.json({
      message: `${platform} task completed!`,
      socialTasks: user.socialTasks
    });
    
  } catch (error) {
    console.error('Social task error:', error);
    return Response.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
