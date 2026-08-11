import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    console.time("connectDB");
    await connectDB();
    console.timeEnd("connectDB");
    
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log('Profile API called for phone:', phone);

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ phone }).select('-rechargeHistory -socialTaskSubmissions.screenshotBase64 -investmentPlans.screenshotData');

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

    // Auto-ensure adWatchDaysLeft is initialized for active plan holders (only if undefined/null)
    const hasActiveInvestment = (user.investmentPlans || []).some(p => p.status === 'active');
    if (hasActiveInvestment && (user.adWatchDaysLeft === undefined || user.adWatchDaysLeft === null)) {
      user.adWatchDaysLeft = 10;
      await user.save();
    }

    console.time("processing");
    // Auto-reset claimedStreakReward if current streak is broken
    if (user.claimedStreakReward) {
      console.time("query2");
      const levelAQuery = { referredBy: user.phone };
      if (user.lastStreakClaimedAt) {
        levelAQuery.createdAt = { $gt: user.lastStreakClaimedAt };
      }
      const rawMembers = await User.find(levelAQuery).select('createdAt investmentPlans.status').lean();
      const levelAMembers = rawMembers.filter(m => Array.isArray(m.investmentPlans) && m.investmentPlans.some(p => p.status === 'active'));
      console.timeEnd("query2");
      const getLocalDayIndex = (dateVal) => {
        const d = new Date(dateVal);
        const localTime = d.getTime() + 5 * 60 * 60 * 1000; // PKT
        return Math.floor(localTime / (24 * 60 * 60 * 1000));
      }
      const activeDays = new Set();
      for (const m of levelAMembers) {
        activeDays.add(getLocalDayIndex(m.createdAt));
      }
      const todayDay = getLocalDayIndex(Date.now());
      let checkDay = todayDay;
      if (!activeDays.has(todayDay)) {
        checkDay = todayDay - 1;
      }
      let streak = 0;
      while (activeDays.has(checkDay)) {
        streak++;
        checkDay--;
      }
      if (streak < 10) {
        user.claimedStreakReward = false;
        await user.save();
      }
    }

    // Auto-populate shortId in sequential format starting from HMH1000
    if (!user.shortId) {
      const lastUser = await User.findOne({ shortId: /^HMH\d+$/ })
        .sort({ shortId: -1 })
        .lean();

      let nextNumber = 1000;
      if (lastUser && lastUser.shortId) {
        const match = lastUser.shortId.match(/^HMH(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      let candidateShortId = `HMH${nextNumber}`;
      let isUnique = false;
      while (!isUnique) {
        const existingUser = await User.findOne({ shortId: candidateShortId }).lean();
        if (!existingUser) {
          isUnique = true;
        } else {
          nextNumber++;
          candidateShortId = `HMH${nextNumber}`;
        }
      }

      user.shortId = candidateShortId;
      await user.save();
    }

    // Return user data without password
    const userData = user.toPublicJSON();
    
    if (userData.referredBy) {
      const upline = await User.findOne({ phone: userData.referredBy }).select('name shortId').lean();
      if (upline) {
        userData.uplineName = upline.name;
        userData.uplineId = upline.shortId;
      }
    }
    
    // Ensure totalRecharge is included in response
    if (userData.totalRecharge === undefined || userData.totalRecharge === null) {
      userData.totalRecharge = 0;
    }

    // Populate user's withdrawal history from Transaction collection
    try {
      const { default: Transaction } = await import('@/models/Transaction');
      const userPhoneClean = (user.phone || '').replace(/^(\+?92|0)/, '');
      const dbTransactions = await Transaction.find({
        type: 'withdraw',
        $or: [
          { userId: user.phone },
          { userId: String(user._id) },
          { userId: user.email },
          { userId: { $regex: new RegExp(userPhoneClean + '$') } }
        ].filter(Boolean)
      }).sort({ createdAt: -1 }).lean();

      if (dbTransactions && dbTransactions.length > 0) {
        const mappedTxns = dbTransactions.map(t => ({
          _id: t._id.toString(),
          amount: t.amount,
          status: t.status,
          date: t.createdAt || t.date || Date.now(),
          paymentMethod: t.withdrawalMethod || t.paymentMethod || 'JazzCash',
          withdrawalMethod: t.withdrawalMethod,
          withdrawalAccountName: t.withdrawalAccountName,
          withdrawalNumber: t.withdrawalNumber,
          description: t.description,
          transactionId: t.transactionId
        }));
        
        // Merge with any embedded items not present in mappedTxns
        const mergedHistory = [...mappedTxns];
        if (Array.isArray(userData.withdrawHistory)) {
          for (const item of userData.withdrawHistory) {
            const exists = mergedHistory.some(m => 
              (item._id && m._id === String(item._id)) || 
              (Number(m.amount) === Number(item.amount) && m.status === item.status)
            );
            if (!exists) {
              mergedHistory.push(item);
            }
          }
        }
        userData.withdrawHistory = mergedHistory;
      }
    } catch (txErr) {
      console.warn('Failed to populate withdrawHistory in profile:', txErr);
    }

    console.time("response");
    const res = NextResponse.json(userData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    console.timeEnd("response");
    console.timeEnd("processing");
    return res;

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