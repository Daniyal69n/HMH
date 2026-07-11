import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import UserInvestment from '@/models/UserInvestment';
import Transaction from '@/models/Transaction';
import SystemSettings from '@/models/SystemSettings';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return Response.json({ message: 'Phone number is required' }, { status: 400 });
    }
    
    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Calculate current PKT date
    const now = new Date();
    const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const currentDate = pktTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check if day changed
    let watchedToday = user.adsWatchedToday || 0;
    if (user.lastAdWatchDate !== currentDate) {
      watchedToday = 0;
    }
    
    // Get active investment plan
    const activeInvestment = await UserInvestment.findOne({
      userId: phone,
      isActive: true
    });
    
    // Fetch ads from system settings
    const adSetting = await SystemSettings.findOne({ key: 'admin_ads' });
    const allAds = adSetting && adSetting.value ? adSetting.value : [
      { id: 'ad_1', title: 'Bsnns', url: 'https://youtube.com/watch?v=demo1', active: true },
      { id: 'ad_2', title: 'Hmh', url: 'https://youtube.com/watch?v=demo2', active: true }
    ];
    
    // Filter active ads
    const activeAds = allAds.filter(ad => ad.active !== false);

    // Fetch earnings plans config
    const earningsSetting = await SystemSettings.findOne({ key: 'earnings_plans' });
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
    const fullDailyUSD = planConfig.perAd * 5;
    
    return Response.json({
      watchedToday,
      activeAds,
      hasActivePlan: !!activeInvestment,
      planName: activeInvestment ? activeInvestment.planName : 'No Plan',
      dailyIncome: `$${fullDailyUSD.toFixed(2)}`
    });
    
  } catch (error) {
    console.error('Error fetching watch ads progress:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { phone, adId } = body;
    
    if (!phone || !adId) {
      return Response.json({ message: 'Phone number and Ad ID are required' }, { status: 400 });
    }
    
    const user = await User.findOne({ phone });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Calculate current PKT date
    const now = new Date();
    const pktTime = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    const currentDate = pktTime.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Reset if day changed
    if (user.lastAdWatchDate !== currentDate) {
      user.adsWatchedToday = 0;
      user.lastAdWatchDate = currentDate;
    }
    
    if (user.adsWatchedToday >= 5) {
      return Response.json({ message: 'You have already watched the limit of 5 ads for today.' }, { status: 400 });
    }
    
    // Find active investment
    const activeInvestment = await UserInvestment.findOne({
      userId: phone,
      isActive: true
    });
    
    // Fetch ads from system settings
    const adSetting = await SystemSettings.findOne({ key: 'admin_ads' });
    const allAds = adSetting && adSetting.value ? adSetting.value : [];
    const ad = allAds.find(a => a.id === adId) || { title: 'Video Ad' };
    
    // Fetch earnings plans config
    const earningsSetting = await SystemSettings.findOne({ key: 'earnings_plans' });
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
    const rewardUSD = planConfig.perAd || 0;
    const rewardPKR = rewardUSD * 300;
    
    // Only credit reward if they have an active plan OR they are on Free plan (which might be configured with a reward too!)
    if (rewardPKR > 0) {
      // Credit reward to user balance
      user.balance = (user.balance || 0) + rewardPKR;
      user.earnBalance = (user.earnBalance || 0) + rewardPKR;
      
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
        description: `Watched Ad: ${ad.title} (+20% daily income)`,
        createdAt: new Date()
      });
      
      // Update investment record if there is one active
      if (activeInvestment) {
        activeInvestment.totalEarned = (activeInvestment.totalEarned || 0) + rewardPKR;
        activeInvestment.lastIncomeDate = new Date();
        await activeInvestment.save();
      }
    }
    
    user.adsWatchedToday += 1;
    await user.save();
    
    return Response.json({
      message: `Successfully watched ad and earned $${rewardUSD.toFixed(2)} (Rs ${rewardPKR.toLocaleString()})!`,
      watchedToday: user.adsWatchedToday,
      balance: user.balance,
      earnBalance: user.earnBalance
    });
    
  } catch (error) {
    console.error('Error recording ad watch:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
