import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { referrerPhone, name, email, phone, password, level, planName, planAmount } = body;

    if (!referrerPhone || !name || !phone || !password || !level) {
      return NextResponse.json(
        { error: 'Referrer phone, name, member phone, password, and level are required' },
        { status: 400 }
      );
    }

    const referrer = await User.findOne({ phone: referrerPhone });
    if (!referrer) {
      return NextResponse.json({ error: 'Referrer user not found' }, { status: 404 });
    }

    // Check if new user already exists
    const existing = await User.findOne({
      $or: [{ phone }, { email: email || '___never_match___' }]
    });
    if (existing) {
      return NextResponse.json({ error: 'User with this phone or email already exists' }, { status: 400 });
    }

    let resolvedParentPhone = null;

    if (level === 'A') {
      resolvedParentPhone = referrer.phone;
    } else if (level === 'B') {
      // Find a Level A member of the referrer to be the parent
      const levelAUser = await User.findOne({ referredBy: referrer.phone });
      if (!levelAUser) {
        return NextResponse.json({ error: 'You must add at least one Level A member first before adding a Level B member.' }, { status: 400 });
      }
      resolvedParentPhone = levelAUser.phone;
    } else if (level === 'C') {
      // Find a Level A member of the referrer first
      const levelAUsers = await User.find({ referredBy: referrer.phone }).select('phone');
      const levelAPhones = levelAUsers.map(u => u.phone);

      if (levelAPhones.length === 0) {
        return NextResponse.json({ error: 'You must add at least one Level A and one Level B member first before adding a Level C member.' }, { status: 400 });
      }

      // Find a Level B member of the referrer (whose referredBy is in levelAPhones)
      const levelBUser = await User.findOne({ referredBy: { $in: levelAPhones } });
      if (!levelBUser) {
        return NextResponse.json({ error: 'You must add at least one Level B member first before adding a Level C member.' }, { status: 400 });
      }
      resolvedParentPhone = levelBUser.phone;
    } else {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }

    // Create the new User
    const newUser = new User({
      name,
      email: email || null,
      phone,
      password,
      referredBy: resolvedParentPhone,
      referralLevel: level,
      balance: 0,
      earnBalance: 0,
      totalCommissionEarned: 0,
      totalRecharge: 0,
      signupBonus: 0,
      investmentPlans: [],
      rechargeHistory: [],
      withdrawHistory: [],
      couponHistory: [],
      teamMembers: []
    });

    if (planName && planName !== 'Free') {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      newUser.investmentPlans.push({
        planId: planName.toLowerCase(),
        planName,
        amount: parseFloat(planAmount) || 0,
        startDate,
        endDate,
        paymentMethod: 'Admin Override',
        status: 'active'
      });
    }

    await newUser.save();

    // Store shortId
    newUser.shortId = newUser._id.toString().slice(-8);
    await newUser.save();

    // Add user to resolved parent's teamMembers
    const parentUser = await User.findOne({ phone: resolvedParentPhone });
    if (parentUser) {
      parentUser.teamMembers.push({
        userId: newUser._id,
        level,
        joinDate: new Date()
      });
      await parentUser.save();
    }

    return NextResponse.json({
      message: 'Network member added successfully!',
      user: newUser.toPublicJSON()
    });

  } catch (error) {
    console.error('Error adding network member:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
