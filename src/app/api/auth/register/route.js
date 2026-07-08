import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, email, phone, password, referralCode } = await request.json();

    // Validate required fields
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, phone number, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists (by phone number only)
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 400 }
      );
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ phone: referralCode });
      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }
    }

    const user = new User({
      name,
      email: email || null,
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
