import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function POST(request) {
  try {
    await connectDB();
    
    const { name, phone, password, referralCode } = await request.json();

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

    // Create new user with signup bonus
    const signupBonusAmount = 100; // Rs 100 signup bonus
    
    const user = new User({
      name,
      phone,
      password,
      referralCode: referralCode || null,
      balance: signupBonusAmount, // Add signup bonus to account balance
      signupBonus: signupBonusAmount, // Track signup bonus separately
      investmentPlans: [],
      rechargeHistory: [],
      withdrawHistory: [],
      couponHistory: [],
      teamMembers: []
    });

    await user.save();

    // Create transaction record for signup bonus
    const signupTransaction = new Transaction({
      userId: user.phone,
      userName: user.name,
      type: 'signup_bonus',
      amount: signupBonusAmount,
      status: 'completed',
      description: 'Welcome bonus for new user registration',
      transactionId: 'SIGNUP' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
    });

    await signupTransaction.save();

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
      message: `Registration successful! Welcome bonus of Rs ${signupBonusAmount} has been added to your account.`,
      ...userData
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
