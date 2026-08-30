import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export const maxDuration = 60; // Increase timeout to 60 seconds for Vercel

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, email, phone, password, referralCode } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone number, and password are required' },
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

    const user = new User({
      name,
      email,
      phone,
      password,
      referralCode: referralCode || null,
      balance: 0,
      signupBonus: 0,
      investmentPlans: [],
      rechargeHistory: [],
      withdrawHistory: [],
      couponHistory: [],
      teamMembers: []
    });

    await user.save();

    // Store shortId in sequential format starting from HMH1000
    const lastUser = await User.findOne({ shortId: /^HMH\d+$/ })
      .sort({ shortId: -1 })
      .lean();

    let nextNumber = 1000;
    if (lastUser && lastUser.shortId) {
      const match = lastUser.shortId.match(/^HMH(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    let candidateShortId = `HMH${nextNumber}`;
    let isUnique = false;
    while (!isUnique) {
      const existingUser = await User.findOne({ shortId: candidateShortId }).lean();
      if (!existingUser) {
        isUnique = true;
      } else {
        nextNumber++;
        candidateShortId = `HMH${nextNumber}`;
      }
    }

    user.shortId = candidateShortId;
    await user.save();

    // Add user to referrer's team if referral code was used
    if (referrer) {
      // Set referral relationship (commission will be given when user buys a plan)
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
