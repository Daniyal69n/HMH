import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    await connectDB();
    
    // Find all users who have an active investment plan
    const users = await User.find({
      'investmentPlans.status': 'active'
    });

    let updated = 0;

    for (const user of users) {
      if (user.adWatchDaysLeft === 0 && (user.totalAdWatchDays === 0 || !user.totalAdWatchDays)) {
        // Check if they ever watched ads
        const watchedAdsCount = await Transaction.countDocuments({
          $or: [{ userId: user.phone }, { userId: String(user._id) }],
          type: 'daily_income'
        });

        // If they never watched any ads, it means they were affected by the bug and didn't get their initial 10 days
        if (watchedAdsCount === 0) {
          user.adWatchDaysLeft = 10;
          user.totalAdWatchDays = 10;
          await user.save();
          updated++;
        } else {
          // If they DID watch ads and their days are 0 now, it means they correctly used their 10 days.
          // We can fix their totalAdWatchDays based on the ads they watched (assuming 3 ads per day)
          const daysUsed = Math.ceil(watchedAdsCount / 3);
          user.totalAdWatchDays = user.adWatchDaysLeft + daysUsed;
          await user.save();
        }
      }
    }

    return NextResponse.json({ success: true, updated, message: `Fixed ${updated} users.` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
