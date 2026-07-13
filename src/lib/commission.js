import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import UserInvestment from '../models/UserInvestment.js';
import InvestmentPlan from '../models/InvestmentPlan.js';

const membershipPlans = {
  'basic': { priceUSD: 5, dailyIncome: 'Rs7.5', validity: '200 days' },
  'standard': { priceUSD: 10, dailyIncome: 'Rs15', validity: '200 days' },
  'diamond': { priceUSD: 20, dailyIncome: 'Rs30', validity: '200 days' },
  'pro': { priceUSD: 30, dailyIncome: 'Rs45', validity: '200 days' },
  'premium': { priceUSD: 40, dailyIncome: 'Rs60', validity: '200 days' },
  'legend': { priceUSD: 50, dailyIncome: 'Rs75', validity: '200 days' }
};

/**
 * Returns the price of the user's current active plan in USD.
 * If the user has no active plan, returns 0.
 */
export async function getUserActivePlanPrice(user) {
  // 1. Check user.investmentPlans for active membership plan
  if (user.investmentPlans && user.investmentPlans.length > 0) {
    const activePlan = [...user.investmentPlans].reverse().find(p => p.status === 'active');
    if (activePlan) {
      const name = activePlan.planName.toLowerCase();
      if (name.includes('basic')) return 5;
      if (name.includes('standard')) return 10;
      if (name.includes('diamond')) return 20;
      if (name.includes('pro')) return 30;
      if (name.includes('premium')) return 40;
      if (name.includes('legend')) return 50;
    }
  }
  
  // 2. Fallback to UserInvestment collection
  const activeInvest = await UserInvestment.findOne({ userId: user.phone, isActive: true });
  if (activeInvest) {
    const amountStr = activeInvest.investAmount.replace(/[$,₹Rs]/g, '').replace(/,/g, '');
    const amount = parseFloat(amountStr) || 0;
    // Standard car plans have large amounts, if >= 50 we treat it as 50 or above
    return amount;
  }
  
  return 0; // No active plan
}

/**
 * Distributes direct referral, indirect, and downline commission if the referrers have active plans.
 */
export async function distributeCommission(buyerPhone, purchaseAmountPKR, planName) {
  console.log(`[Commission] Starting commission distribution for buyer: ${buyerPhone}, plan: ${planName}, amount: ${purchaseAmountPKR} PKR`);
  
  const buyer = await User.findOne({ phone: buyerPhone });
  if (!buyer || !buyer.referredBy) {
    console.log(`[Commission] Buyer has no referrer or not found.`);
    return;
  }

  // Load dynamic earnings settings from DB
  let earningsPlans = [
    { id: 'free',     name: 'Free Plan',     perAd: 0.02, refA: 0,  refB: 0, refC: 0 },
    { id: 'basic',    name: 'Basic Plan',    perAd: 0.20, refA: 20, refB: 5, refC: 5 },
    { id: 'standard', name: 'Standard Plan', perAd: 0.40, refA: 20, refB: 5, refC: 5 },
    { id: 'diamond',  name: 'Diamond Plan',  perAd: 0.80, refA: 20, refB: 5, refC: 5 },
    { id: 'pro',      name: 'Pro Plan',      perAd: 1.20, refA: 20, refB: 5, refC: 5 },
    { id: 'premium',  name: 'Premium Plan',  perAd: 1.60, refA: 20, refB: 5, refC: 5 },
    { id: 'legend',   name: 'Legend Plan',   perAd: 2.00, refA: 20, refB: 5, refC: 5 }
  ];

  try {
    const SystemSettings = (await import('../models/SystemSettings.js')).default;
    const settings = await SystemSettings.findOne({ key: 'earnings_plans' });
    if (settings && settings.value) {
      earningsPlans = settings.value;
    }
  } catch (err) {
    console.warn('[Commission] Failed to load earnings plans settings, using fallback.', err.message);
  }

  // Find config of the purchased plan to determine commission percentages
  const name = (planName || '').toLowerCase();
  let purchasedPlanId = 'free';
  if (name.includes('basic')) purchasedPlanId = 'basic';
  else if (name.includes('standard')) purchasedPlanId = 'standard';
  else if (name.includes('diamond')) purchasedPlanId = 'diamond';
  else if (name.includes('pro')) purchasedPlanId = 'pro';
  else if (name.includes('premium')) purchasedPlanId = 'premium';
  else if (name.includes('legend')) purchasedPlanId = 'legend';

  const planConfig = earningsPlans.find(p => p.id === purchasedPlanId) || earningsPlans[0];
  const rateA = (planConfig.refA || 0) / 100.0;
  const rateB = (planConfig.refB || 0) / 100.0;
  const rateC = (planConfig.refC || 0) / 100.0;

  // --- LEVEL 1: Direct Referrer (R1) ---
  const r1 = await User.findOne({ phone: buyer.referredBy });
  if (!r1) {
    console.log(`[Commission] Direct referrer (R1) not found.`);
    return;
  }

  // R1 must have an active plan to receive commission
  const r1PlanPrice = await getUserActivePlanPrice(r1);

  // Award Ad Watch Bonus Days
  let extraDays = 0;
  let r1PlanId = 'free';
  if (r1PlanPrice === 5) r1PlanId = 'basic';
  else if (r1PlanPrice === 10) r1PlanId = 'standard';
  else if (r1PlanPrice === 20) r1PlanId = 'diamond';
  else if (r1PlanPrice === 30) r1PlanId = 'pro';
  else if (r1PlanPrice === 40) r1PlanId = 'premium';
  else if (r1PlanPrice >= 50) r1PlanId = 'legend';

  if (r1PlanId !== 'free' && purchasedPlanId !== 'free') {
    if (r1PlanId === purchasedPlanId) {
      extraDays = 10;
    } else {
      if (purchasedPlanId === 'basic') extraDays = 2;
      else if (purchasedPlanId === 'standard') extraDays = 3;
      else if (purchasedPlanId === 'diamond') extraDays = 4;
      else if (purchasedPlanId === 'pro') extraDays = 6;
      else if (purchasedPlanId === 'premium') extraDays = 8;
      else if (purchasedPlanId === 'legend') extraDays = 10;
    }
    r1.adWatchDaysLeft = (r1.adWatchDaysLeft || 0) + extraDays;
    await r1.save();
  }

  if (r1PlanPrice > 0) {
    // Dynamic Level A Commission
    const comm1 = purchaseAmountPKR * rateA;
    if (comm1 > 0) {
      r1.earnBalance = (r1.earnBalance || 0) + comm1;
      r1.balance = (r1.balance || 0) + comm1;
      r1.referralCommission = (r1.referralCommission || 0) + comm1;
      await r1.save();

      await Transaction.create({
        userId: r1.phone,
        userName: r1.name,
        type: 'referral_income',
        amount: comm1,
        status: 'approved',
        description: `Direct referral commission (${(rateA * 100).toFixed(0)}%) from ${buyer.name} (${buyer.phone}) for purchasing ${planName}`,
        referredUser: buyer.phone,
        referralLevel: 'A',
        transactionId: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
      });
      console.log(`[Commission] Level 1 (Direct) commission of ${comm1} PKR awarded to ${r1.name} (${r1.phone})`);
    }
  } else {
    console.log(`[Commission] Level 1 referrer ${r1.name} (${r1.phone}) ineligible (No active plan)`);
  }

  // If R1 doesn't have a referrer, stop
  if (!r1.referredBy) return;

  // --- LEVEL 2: Indirect Referrer (R2) ---
  const r2 = await User.findOne({ phone: r1.referredBy });
  if (!r2) {
    console.log(`[Commission] Level 2 referrer (R2) not found.`);
    return;
  }

  // R2 must have an active plan to receive commission
  const r2PlanPrice = await getUserActivePlanPrice(r2);
  if (r2PlanPrice > 0) {
    // Dynamic Level B Commission
    const comm2 = purchaseAmountPKR * rateB;
    if (comm2 > 0) {
      r2.earnBalance = (r2.earnBalance || 0) + comm2;
      r2.balance = (r2.balance || 0) + comm2;
      r2.referralCommission = (r2.referralCommission || 0) + comm2;
      await r2.save();

      await Transaction.create({
        userId: r2.phone,
        userName: r2.name,
        type: 'referral_income',
        amount: comm2,
        status: 'approved',
        description: `Indirect referral commission (${(rateB * 100).toFixed(0)}%) from ${buyer.name} (${buyer.phone}) via ${r1.name}`,
        referredUser: buyer.phone,
        referralLevel: 'B',
        transactionId: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
      });
      console.log(`[Commission] Level 2 (Indirect) commission of ${comm2} PKR awarded to ${r2.name} (${r2.phone})`);
    }
  } else {
    console.log(`[Commission] Level 2 referrer ${r2.name} (${r2.phone}) ineligible (No active plan)`);
  }

  // If R2 doesn't have a referrer, stop
  if (!r2.referredBy) return;

  // --- LEVEL 3: Downline Referrer (R3) ---
  const r3 = await User.findOne({ phone: r2.referredBy });
  if (!r3) {
    console.log(`[Commission] Level 3 referrer (R3) not found.`);
    return;
  }

  // R3 must have a plan of $40 or $50 to receive Downline Commission
  const r3PlanPrice = await getUserActivePlanPrice(r3);
  if (r3PlanPrice >= 40) {
    // Dynamic Level C Commission
    const comm3 = purchaseAmountPKR * rateC;
    if (comm3 > 0) {
      r3.earnBalance = (r3.earnBalance || 0) + comm3;
      r3.balance = (r3.balance || 0) + comm3;
      r3.referralCommission = (r3.referralCommission || 0) + comm3;
      await r3.save();

      await Transaction.create({
        userId: r3.phone,
        userName: r3.name,
        type: 'referral_income',
        amount: comm3,
        status: 'approved',
        description: `Downline commission (${(rateC * 100).toFixed(0)}%) from ${buyer.name} (${buyer.phone}) via ${r2.name}`,
        referredUser: buyer.phone,
        referralLevel: 'C',
        transactionId: 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
      });
      console.log(`[Commission] Level 3 (Downline) commission of ${comm3} PKR awarded to ${r3.name} (${r3.phone})`);
    }
  } else {
    console.log(`[Commission] Level 3 referrer ${r3.name} (${r3.phone}) ineligible (Active plan $${r3PlanPrice} < $40)`);
  }
}

/**
 * Handles plan requests activation and commission distribution without creating any active daily-income UserInvestment records.
 */
export async function activateUserPlan(user, planToApprove) {
  // 1. Deactivate other active plans in user's investmentPlans array
  for (const p of user.investmentPlans) {
    if (p._id.toString() !== planToApprove._id.toString() && p.status === 'active') {
      p.status = 'completed';
    }
  }
  planToApprove.status = 'active';
  
  // 2. Update ad watch limit and Save the updated user object
  user.adWatchDaysLeft = (user.adWatchDaysLeft || 0) + 10;
  await user.save();

  // 3. Distribute the commissions based on the amount the user requested (which is what they paid)
  await distributeCommission(user.phone, planToApprove.amount, planToApprove.planName);
}
