import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getNextShortId } from '@/lib/shortId';

export const maxDuration = 60; // Increase timeout to 60 seconds for Vercel
export const dynamic = 'force-dynamic';

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

    // Fast exact check for TRX ID uniqueness if provided
    let cleanedTrxId = null;
    if (trxId && typeof trxId === 'string' && trxId.trim()) {
      cleanedTrxId = trxId.trim();
      if (cleanedTrxId.length < 8 || cleanedTrxId.length > 30) {
        return NextResponse.json(
          { error: 'TRX ID must be between 8 and 30 characters' },
          { status: 400 }
        );
      }
      const existingTrx = await User.findOne({
        'investmentPlans.trxId': cleanedTrxId
      }).select('_id').lean();

      if (existingTrx) {
        return NextResponse.json(
          { error: 'This TRX ID has already been used. Please enter a valid unique TRX ID.' },
          { status: 400 }
        );
      }
    }

    // Fast check if user already exists (by phone number or email)
    const existingUser = await User.findOne({
      $or: [{ phone }, { email }]
    }).select('email phone').lean();

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

    // Validate referral code if provided (single indexed lookup)
    let referrer = null;
    if (referralCode && typeof referralCode === 'string' && referralCode.trim()) {
      const cleanedRef = referralCode.trim();
      referrer = await User.findOne({
        $or: [
          { shortId: cleanedRef },
          { shortId: cleanedRef.toUpperCase() },
          { phone: cleanedRef }
        ]
      }).select('_id phone name').lean();

      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }
    }

    // Process screenshot if provided as base64 fallback with 4-second timeout
    let finalScreenshotUrl = screenshotUrl || null;
    if (screenshotUrl && typeof screenshotUrl === 'string' && screenshotUrl.startsWith('data:image')) {
      try {
        const uploadPromise = (async () => {
          const { uploadBase64ToCloudinary } = await import('@/lib/cloudinaryHelper');
          return await uploadBase64ToCloudinary(screenshotUrl, 'plan-requests');
        })();
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
        const cUrl = await Promise.race([uploadPromise, timeoutPromise]);
        if (cUrl) {
          finalScreenshotUrl = cUrl;
        }
      } catch (err) {
        console.warn('Cloudinary upload fallback in register route:', err);
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
      referralCode: referralCode ? referralCode.trim() : null,
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

    // Fast atomic update to add user to referrer's team
    if (referrer) {
      await User.updateOne(
        { _id: referrer._id },
        {
          $push: {
            teamMembers: {
              userId: user._id,
              level: 'A',
              joinDate: new Date()
            }
          }
        }
      ).catch(err => console.warn('Error updating referrer teamMembers:', err));
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
