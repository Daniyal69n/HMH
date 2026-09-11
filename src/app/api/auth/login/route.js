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

    const cleanEmail = email.trim().toLowerCase();
    console.log('Login attempt for email:', cleanEmail);

    // Find user by email (indexed search + exclude heavy screenshot base64 payloads to speed up login query)
    let user = await User.findOne({ email: cleanEmail }).select('-socialTaskSubmissions.screenshotBase64 -investmentPlans.screenshotData');

    // Fallback: Check exact original string or case-insensitive if lowercase lookup produced no result
    if (!user) {
      user = await User.findOne({
        email: { $regex: new RegExp(`^${cleanEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
      }).select('-socialTaskSubmissions.screenshotBase64 -investmentPlans.screenshotData');
    }

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
        { error: 'Your account has been blocked by admin. Please contact admin for support or email: support@hondacivicinvestment.com' },
        { status: 403 }
      );
    }

    // Allow pending and rejected users to log in; menu permissions and restrictions are handled on frontend
    // Only blocked users are denied login

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