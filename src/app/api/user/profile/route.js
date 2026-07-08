import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log('Profile API called for phone:', phone);

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ensure totalRecharge field exists (for backward compatibility)
    if (user.totalRecharge === undefined || user.totalRecharge === null) {
      user.totalRecharge = 0;
      await user.save();
    }

    // Auto-populate shortId for existing users that don't have it yet
    if (!user.shortId) {
      user.shortId = user._id.toString().slice(-8);
      await user.save();
    }

    // Return user data without password
    const userData = user.toPublicJSON();
    
    // Ensure totalRecharge is included in response
    if (userData.totalRecharge === undefined || userData.totalRecharge === null) {
      userData.totalRecharge = 0;
    }
    
    console.log('User data being returned:', {
      phone: userData.phone,
      balance: userData.balance,
      earnBalance: userData.earnBalance,
      totalRecharge: userData.totalRecharge
    });

    return NextResponse.json(userData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    
    const { phone, updates } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { phone },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return updated user data without password
    const userData = user.toPublicJSON();

    return NextResponse.json({
      message: 'Profile updated successfully',
      ...userData
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 