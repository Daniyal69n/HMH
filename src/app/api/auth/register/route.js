import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import InvestmentPlan from '@/models/InvestmentPlan';
import { getNextShortId } from '@/lib/shortId';

export const maxDuration = 60; // Increase timeout to 60 seconds for Vercel

const PLAN_AMOUNT_MAP = {
  basic: 1500,
  standard: 3000,
  diamond: 6000,
  pro: 9000,
  premium: 12000,
  legend: 15000
};

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, email, phone, password, referralCode, selectedPlan, trxId, screenshotData } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone number, and password are required' },
        { status: 400 }
      );
    }

    if (!trxId || !trxId.trim()) {
      return NextResponse.json(
        { error: 'Transaction ID (TRX ID) is required' },
        { status: 400 }
      );
    }

    const cleanedTrxId = trxId.trim();

    if (cleanedTrxId.length < 6 || cleanedTrxId.length > 40) {
      return NextResponse.json(
        { error: 'TRX ID must be between 6 and 40 characters long' },
        { status: 400 }
      );
    }

    // Check if TRX ID has already been used across all investmentPlans
    const existingUserWithTrx = await User.findOne({
      'investmentPlans.trxId': { $regex: new RegExp(`^${cleanedTrxId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (existingUserWithTrx) {
      return NextResponse.json(
        { error: 'This TRX ID has already been used. Please enter a valid unique TRX ID.' },
        { status: 400 }
      );
    }

    // Check if user already exists (by phone number or email)
    const existingUser = await User.findOne({ 
      $or: [{ phone }, { email }] 
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 400 }
      );
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode) {
      // Try matching by shortId field first, then phone (backward compat)
      referrer = await User.findOne({ shortId: referralCode });
      if (!referrer) {
        referrer = await User.findOne({ phone: referralCode });
      }
      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }
    }

    // Determine plan amount
    const planKey = (selectedPlan || 'Basic').toLowerCase().trim();
    let planAmount = PLAN_AMOUNT_MAP[planKey] || 1500;
    let chosenPlanName = selectedPlan || 'Basic';

    try {
      const dbPlan = await InvestmentPlan.findOne({ name: new RegExp(`^${chosenPlanName}$`, 'i') });
      if (dbPlan && dbPlan.investAmount) {
        chosenPlanName = dbPlan.name;
        const parsed = parseFloat(String(dbPlan.investAmount).replace(/[^\d.]/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
          planAmount = parsed;
        }
      }
    } catch (e) {
      console.warn('Plan lookup fallback:', e.message);
    }

    // Handle optional screenshot upload to Cloudinary if base64 provided
    let finalScreenshotUrl = null;
    if (screenshotData && typeof screenshotData === 'string' && screenshotData.startsWith('data:image')) {
      try {
        const { uploadBase64ToCloudinary } = await import('@/lib/cloudinaryHelper');
        const cUrl = await uploadBase64ToCloudinary(screenshotData, 'plan-requests');
        if (cUrl) {
          finalScreenshotUrl = cUrl;
        }
      } catch (uploadErr) {
        console.warn('Cloudinary upload error in register:', uploadErr.message);
      }
    } else if (screenshotData && typeof screenshotData === 'string') {
      finalScreenshotUrl = screenshotData;
    }

    const pendingPlan = {
      planName: chosenPlanName,
      amount: planAmount,
      trxId: cleanedTrxId,
      status: 'pending',
      startDate: new Date(),
      paymentMethod: 'Registration / TRX ID',
      screenshotData: finalScreenshotUrl
    };

    const user = new User({
      name,
      email,
      phone,
      password,
      status: 'approved', // User account is approved so they can login and access dashboard
      referralCode: referralCode || null,
      balance: 0,
      signupBonus: 0,
      investmentPlans: [pendingPlan],
      rechargeHistory: [],
      withdrawHistory: [],
      couponHistory: [],
      teamMembers: []
    });

    await user.save();

    // Atomically reserve the next sequential shortId (e.g. "HMH1000").
    user.shortId = await getNextShortId();
    await user.save();

    // Add user to referrer's team if referral code was used
    if (referrer) {
      user.referredBy = referrer.phone;
      user.referralLevel = 'A';
      await user.save();
      
      // Add to referrer's team members
      referrer.teamMembers.push({
        userId: user._id,
        level: 'A',
        joinDate: new Date()
      });
      
      await referrer.save();
    }

    // Return user data without password
    const userData = user.toPublicJSON();

    return NextResponse.json({
      message: 'Registration successful! Please sign in.',
      ...userData
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
