import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import UserInvestment from '@/models/UserInvestment';
import Transaction from '@/models/Transaction';
import SystemSettings from '@/models/SystemSettings';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone } = body;
    
    if (!phone) {
      return Response.json({ message: 'Phone number is required' }, { status: 400 });
    }
    
    const user = await User.findOne({ phone }).select('-profilePicture');
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Calculate current PKT date
    const now = new Date();
    const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const currentDate = pktTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check if they already claimed today
    if (user.lastAdRewardClaimDate === currentDate) {
      return Response.json({ message: 'You have already collected your daily ad reward today.' }, { status: 400 });
    }
    
    // Fetch ads from system settings
    const adSetting = await SystemSettings.findOne({ key: 'admin_ads' }).lean();
    const allAds = adSetting && adSetting.value && adSetting.value.length > 0 ? adSetting.value : [
      { id: 'ad_1', title: 'Bsnns', url: 'https://youtube.com/watch?v=demo1', active: true },
      { id: 'ad_2', title: 'Hmh', url: 'https://youtube.com/watch?v=demo2', active: true }
    ];
    const activeAds = allAds.filter(ad => ad.active !== false);
    
    if (activeAds.length === 0) {
      return Response.json({ message: 'No active ads available to collect rewards for.' }, { status: 400 });
    }
    
    // Reset if day changed
    let adsWatched = user.adsWatchedToday || 0;
    if (user.lastAdWatchDate !== currentDate) {
      adsWatched = 0;
      user.adsWatchedToday = 0;
      user.lastAdWatchDate = currentDate;
      await user.save();
    }
    
    // Check if user watched all active ads
    if (adsWatched < activeAds.length) {
      return Response.json({
        message: `Please watch all ${activeAds.length} ads to collect your reward. You have watched ${adsWatched} so far.`
      }, { status: 400 });
    }
    
    // Find active investment
    const activeInvestment = await UserInvestment.findOne({
      userId: phone,
      isActive: true
    });

    let adWatchDaysLeft = user.adWatchDaysLeft;

    if (activeInvestment) {
      if (adWatchDaysLeft === undefined || adWatchDaysLeft === null) {
        adWatchDaysLeft = 10;
        user.adWatchDaysLeft = 10;
        await user.save();
      }
      if (adWatchDaysLeft <= 0) {
        return Response.json({ message: 'Ad limit reached. Please invite a member to unlock more days.' }, { status: 403 });
      }
    } else {
      return Response.json({ message: 'Please purchase a plan to collect ad rewards.' }, { status: 403 });
    }
    
    // Fetch earnings plans config
    const earningsSetting = await SystemSettings.findOne({ key: 'earnings_plans' }).lean();
    const earningsPlans = earningsSetting && earningsSetting.value ? earningsSetting.value : [
      { id: 'free',     name: 'Free Plan',     perAd: 0.02, refA: 0,  refB: 0, refC: 0 },
      { id: 'basic',    name: 'Basic Plan',    perAd: 0.20, refA: 20, refB: 5, refC: 5 },
      { id: 'standard', name: 'Standard Plan', perAd: 0.40, refA: 20, refB: 5, refC: 5 },
      { id: 'diamond',  name: 'Diamond Plan',  perAd: 0.80, refA: 20, refB: 5, refC: 5 },
      { id: 'pro',      name: 'Pro Plan',      perAd: 1.20, refA: 20, refB: 5, refC: 5 },
      { id: 'premium',  name: 'Premium Plan',  perAd: 1.60, refA: 20, refB: 5, refC: 5 },
      { id: 'legend',   name: 'Legend Plan',   perAd: 2.00, refA: 20, refB: 5, refC: 5 }
    ];

    let planId = 'free';
    if (activeInvestment) {
      const name = activeInvestment.planName.toLowerCase();
      if (name.includes('basic')) planId = 'basic';
      else if (name.includes('standard')) planId = 'standard';
      else if (name.includes('diamond')) planId = 'diamond';
      else if (name.includes('pro')) planId = 'pro';
      else if (name.includes('premium')) planId = 'premium';
      else if (name.includes('legend')) planId = 'legend';
    }

    const planConfig = earningsPlans.find(p => p.id === planId) || earningsPlans[0];
    const rewardUSD = (planConfig.perAd || 0) * activeAds.length;
    const rewardPKR = rewardUSD * 300;
    
    if (rewardPKR > 0) {
      // Credit reward to user balance
      user.balance = (user.balance || 0) + rewardPKR;
      user.earnBalance = (user.earnBalance || 0) + rewardPKR;
      user.lastAdRewardClaimDate = currentDate;
      user.adWatchDaysLeft -= 1;
      await user.save();
      
      // Create transaction log
      const txnId = `TXN-AD-${Date.now()}`;
      await Transaction.create({
        transactionId: txnId,
        userId: user.phone,
        userName: user.name,
        userPhone: user.phone,
        amount: rewardPKR,
        type: 'daily_income',
        status: 'completed',
        description: `Collected Ads Reward for ${activeAds.length} Ads`,
        createdAt: new Date()
      });
      
      // Update investment record if there is one active
      if (activeInvestment) {
        activeInvestment.totalEarned = (activeInvestment.totalEarned || 0) + rewardPKR;
        activeInvestment.lastIncomeDate = new Date();
        await activeInvestment.save();
      }
    } else {
      // If reward is 0, still mark as claimed
      user.lastAdRewardClaimDate = currentDate;
      user.adWatchDaysLeft -= 1;
      await user.save();
    }
    
    return Response.json({
      message: `Successfully collected reward of $${rewardUSD.toFixed(2)} (Rs ${rewardPKR.toLocaleString()})!`,
      rewardUSD,
      rewardPKR,
      balance: user.balance,
      earnBalance: user.earnBalance
    });
    
  } catch (error) {
    console.error('Error collecting daily reward:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
