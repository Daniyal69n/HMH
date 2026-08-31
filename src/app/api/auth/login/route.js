import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const maxDuration = 60; // Increase timeout to 60 seconds for Vercel

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Login attempt for email:', email);

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.log('No user found with email:', email);
      return NextResponse.json(
        { error: 'No account found with this email. Please register first.' },
        { status: 404 }
      );
    }

    console.log('User found:', user.name);

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('User is blocked:', user.name);
      return NextResponse.json(
        { error: 'Your account has been blocked by admin. Please contact admin for support.' },
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
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}