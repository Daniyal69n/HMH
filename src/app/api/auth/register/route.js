import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getNextShortId } from '@/lib/shortId';

export const maxDuration = 60; // Increase timeout to 60 seconds for Vercel

export async function POST(request) {
  try {
    await connectDB();

    const { name, email, phone, password, referralCode, planName, planAmount, paymentMethod, trxId, screenshotUrl } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone number, and password are required' },
        { status: 400 }
      );
    }

    // Check TRX ID uniqueness if provided
    let cleanedTrxId = null;
    if (trxId && trxId.trim()) {
      cleanedTrxId = trxId.trim();
      if (cleanedTrxId.length < 8 || cleanedTrxId.length > 30) {
        return NextResponse.json(
          { error: 'TRX ID must be between 8 and 30 characters' },
          { status: 400 }
        );
      }
      const existingTrx = await User.findOne({
        'investmentPlans.trxId': { $regex: new RegExp(`^${cleanedTrxId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (existingTrx) {
        return NextResponse.json(
          { error: 'This TRX ID has already been used. Please enter a valid unique TRX ID.' },
          { status: 400 }
        );
      }
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

    // Process screenshot if provided as base64 fallback
    let finalScreenshotUrl = screenshotUrl || null;
    if (screenshotUrl && typeof screenshotUrl === 'string' && screenshotUrl.startsWith('data:image')) {
      try {
        const { uploadBase64ToCloudinary } = await import('@/lib/cloudinaryHelper');
        const cUrl = await uploadBase64ToCloudinary(screenshotUrl, 'plan-requests');
        if (cUrl) {
          finalScreenshotUrl = cUrl;
        }
      } catch (err) {
        console.warn('Cloudinary upload error in register route:', err);
      }
    }

    const initialInvestmentPlans = [];
    if (cleanedTrxId || planName) {
      initialInvestmentPlans.push({
        planName: planName || 'Basic',
        amount: parseFloat(planAmount) || 1500,
        trxId: cleanedTrxId || ('REG' + Date.now()),
        status: 'pending',
        startDate: new Date(),
        paymentMethod: paymentMethod || 'JazzCash',
        screenshotData: finalScreenshotUrl
      });
    }

    const userShortId = await getNextShortId();

    const user = new User({
      name,
      email,
      phone,
      password,
      shortId: userShortId,
      referralCode: referralCode || null,
      referredBy: referrer ? referrer.phone : null,
      referralLevel: referrer ? 'A' : null,
      status: (cleanedTrxId || planName) ? 'pending' : 'approved',
      balance: 0,
      signupBonus: 0,
      investmentPlans: initialInvestmentPlans,
      rechargeHistory: [],
      withdrawHistory: [],
      couponHistory: [],
      teamMembers: []
    });

    await user.save();

    // Add user to referrer's team if referral code was used
    if (referrer) {
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
