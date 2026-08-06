import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();
    
    const users = await User.find({});
    let updated = 0;

    for (const user of users) {
      const left = user.adWatchDaysLeft || 0;
      const total = user.totalAdWatchDays || 0;

      if (total < left) {
        user.totalAdWatchDays = left;
        await user.save();
        updated++;
      }
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
