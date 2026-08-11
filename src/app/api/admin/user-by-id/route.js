import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const shortId = searchParams.get('shortId');

    if (!shortId) {
      return NextResponse.json({ error: 'shortId is required' }, { status: 400 });
    }

    const user = await User.findOne({ shortId }).select('name phone shortId').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
      shortId: user.shortId
    });
  } catch (error) {
    console.error('Error fetching user by shortId:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
