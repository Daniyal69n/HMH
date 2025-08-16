import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    await connectDB();
    
    const { phone, password } = await request.json();

    // Validate required fields
    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    console.log('Login attempt for phone:', phone);

    // Find user by phone number
    const user = await User.findOne({ phone });

    if (!user) {
      console.log('No user found with phone:', phone);
      return NextResponse.json(
        { error: 'No account found with this phone number. Please register first.' },
        { status: 404 }
      );
    }

    console.log('User found:', user.name);

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('User is blocked:', user.name);
      return NextResponse.json(
        { error: 'Your account has been blocked by admin. Please contact admin for support or email: support@hondacivicinvestment.com' },
        { status: 403 }
      );
    }

    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', user.name);
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    console.log('Password verified successfully for user:', user.name);

    // Return user data without password
    const userData = user.toPublicJSON();

    return NextResponse.json({
      message: 'Login successful! Welcome back.',
      ...userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
} 