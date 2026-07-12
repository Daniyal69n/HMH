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
    
    // Run all database queries concurrently
    const [user, activeInvestment, adSetting, earningsSetting] = await Promise.all([
      User.findOne({ phone }).select('-profilePicture').lean(),
      UserInvestment.findOne({ userId: phone, isActive: true }).lean(),
      SystemSettings.findOne({ key: 'admin_ads' }).lean(),
      SystemSettings.findOne({ key: 'earnings_plans' }).lean()
    ]);
    
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
    
    // Fetch ads from system settings
    const allAds = adSetting && adSetting.value && adSetting.value.length > 0 ? adSetting.value : [
      { id: 'ad_1', title: 'Bsnns', url: 'https://youtube.com/watch?v=demo1', active: true },
      { id: 'ad_2', title: 'Hmh', url: 'https://youtube.com/watch?v=demo2', active: true }
    ];
    
    // Filter active ads
    const activeAds = allAds.filter(ad => ad.active !== false);

    // Fetch earnings plans config
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
    const fullDailyUSD = planConfig.perAd * activeAds.length;
    const claimedToday = user.lastAdRewardClaimDate === currentDate;
    
    return Response.json({
      watchedToday,
      activeAds,
      hasActivePlan: !!activeInvestment,
      planName: activeInvestment ? activeInvestment.planName : 'No Plan',
      dailyIncome: `$${fullDailyUSD.toFixed(2)}`,
      claimedToday
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
    
    const user = await User.findOne({ phone }).select('-profilePicture');
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
    
    // Fetch ads from system settings
    const adSetting = await SystemSettings.findOne({ key: 'admin_ads' });
    const allAds = adSetting && adSetting.value && adSetting.value.length > 0 ? adSetting.value : [
      { id: 'ad_1', title: 'Bsnns', url: 'https://youtube.com/watch?v=demo1', active: true },
      { id: 'ad_2', title: 'Hmh', url: 'https://youtube.com/watch?v=demo2', active: true }
    ];
    const activeAds = allAds.filter(ad => ad.active !== false);

    if (user.adsWatchedToday >= activeAds.length) {
      return Response.json({ message: `You have already watched the limit of ${activeAds.length} ads for today.` }, { status: 400 });
    }
    
    user.adsWatchedToday += 1;
    await user.save();
    
    return Response.json({
      message: `Successfully watched ad!`,
      watchedToday: user.adsWatchedToday,
      balance: user.balance,
      earnBalance: user.earnBalance
    });
    
  } catch (error) {
    console.error('Error recording ad watch:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
