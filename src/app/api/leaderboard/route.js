import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import SystemSettings from '@/models/SystemSettings';
import Transaction from '@/models/Transaction';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    console.time("connectDB");
    await connectDB();
    console.timeEnd("connectDB");

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // 15 days in milliseconds
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

    // Check cycle state
    console.log("[Leaderboard] Starting DB query for cycle state");
    console.time("query1");
    let cycleState = await SystemSettings.findOne({ key: 'mystery_box_cycle' }).lean();
    console.timeEnd("query1");
    console.log("[Leaderboard] Cycle state fetched:", !!cycleState);

    let cycleEndDate = null;
    let cycleWinners = [];

    if (!cycleState || !cycleState.value) {
      console.log("[Leaderboard] Initializing cycle state");
      // Initialize cycle
      cycleEndDate = new Date(Date.now() + FIFTEEN_DAYS_MS);
      await SystemSettings.findOneAndUpdate(
        { key: 'mystery_box_cycle' },
        {
          value: {
            cycleEndDate,
            winners: []
          },
          description: 'Tracks the 15-day mystery box cycle'
        },
        { upsert: true }
      );
    } else {
      cycleEndDate = new Date(cycleState.value.cycleEndDate);
      cycleWinners = cycleState.value.winners || [];
    }

    const cycleStartDate = new Date(cycleEndDate.getTime() - FIFTEEN_DAYS_MS);

    // Aggregate completed income transactions for each user during the current 15-day cycle
    const fifteenDayEarnings = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          type: { $in: ['daily_income', 'referral_income', 'coupon_redeem', 'signup_bonus', 'level_reward', 'social_task_reward'] },
          createdAt: { $gte: cycleStartDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          total: { $sum: '$amount' }
        }
      }
    ]);

    const fifteenDayMap = {};
    fifteenDayEarnings.forEach(item => {
      if (item._id) {
        fifteenDayMap[item._id] = item.total;
      }
    });

    const topUsers = await User.aggregate([
      { $match: { isAdmin: { $ne: true }, isBlocked: { $ne: true } } },
      {
        $project: {
          name: 1,
          phone: 1,
          profilePicture: 1,
          claimedLevels: 1,
          customTotalEarnings: 1,
          earnBalance: 1,
          totalCommissionEarned: 1,
          computedEarnings: {
            $ifNull: [
              "$customTotalEarnings",
              { $add: [{ $ifNull: ["$earnBalance", 0] }, { $ifNull: ["$totalCommissionEarned", 0] }] }
            ]
          }
        }
      }
    ]);

    console.timeEnd("query2");

    console.time("processing");
    const realLeaders = topUsers.map(user => {
      const level = (user.claimedLevels && user.claimedLevels.length > 0) ? Math.max(...user.claimedLevels) : 1;
      const amt = user.computedEarnings / 300.0; // convert PKR to USD
      
      const fifteenDayPKR = fifteenDayMap[user.phone] || 0;
      const fifteenDayAmt = fifteenDayPKR / 300.0; // convert PKR to USD

      const nameParts = (user.name || '').trim().split(/\s+/);
      let displayName = user.name || 'Anonymous';
      if (nameParts.length > 1) {
        const firstName = nameParts[0];
        const lastPart = nameParts[nameParts.length - 1];
        if (lastPart && lastPart.length > 0) {
          const lastInitial = lastPart[0].toUpperCase();
          displayName = `${firstName} ${lastInitial}.`;
        }
      }

      return {
        phone: user.phone,
        name: displayName,
        level,
        amt,
        fifteenDayAmt,
        profilePicture: user.profilePicture || ''
      };
    });

    // Sort by 15 days earnings descending, then by all time earnings descending
    realLeaders.sort((a, b) => {
      if (b.fifteenDayAmt !== a.fifteenDayAmt) {
        return b.fifteenDayAmt - a.fifteenDayAmt;
      }
      return b.amt - a.amt;
    });

    // Take top 10 unique names
    const uniqueLeaders = [];
    const seenNames = new Set();
    for (const u of realLeaders) {
      if (!seenNames.has(u.name)) {
        seenNames.add(u.name);
        uniqueLeaders.push(u);
      }
      if (uniqueLeaders.length === 10) break;
    }

    let data = uniqueLeaders;

    // Cycle check: If current time is past the end date, end cycle and set winners!
    if (Date.now() >= cycleEndDate.getTime()) {
      const defaultPrizes = {
        1: '$100 Cash Prize + Gold Badge',
        2: '$50 Cash Prize + Silver Badge',
        3: '$25 Cash Prize + Bronze Badge'
      };

      // Pick top 3 winners with their details
      const top3 = uniqueLeaders.slice(0, 3).map((u, index) => {
        const rank = index + 1;
        return {
          phone: u.phone,
          name: u.name,
          profilePicture: u.profilePicture || '',
          level: u.level || 1,
          amt: u.amt || 0,
          fifteenDayAmt: u.fifteenDayAmt || 0,
          rank,
          prize: defaultPrizes[rank] || '',
          claimed: false
        };
      });
      cycleWinners = top3;

      // Reset cycle end date
      const newEndDate = new Date(Date.now() + FIFTEEN_DAYS_MS);

      // Save winners and new end date
      await SystemSettings.findOneAndUpdate(
        { key: 'mystery_box_cycle' },
        {
          value: {
            cycleEndDate: newEndDate,
            winners: cycleWinners
          }
        }
      );

      cycleEndDate = newEndDate;
    }

    // Enrich cycleWinners if name or profilePicture is missing from past cycles
    if (Array.isArray(cycleWinners) && cycleWinners.length > 0) {
      const defaultPrizes = {
        1: '$100 Cash Prize + Gold Badge',
        2: '$50 Cash Prize + Silver Badge',
        3: '$25 Cash Prize + Bronze Badge'
      };
      cycleWinners = cycleWinners.map(w => {
        const matchedUser = realLeaders.find(l => l.phone === w.phone);
        const rank = w.rank || 1;
        return {
          phone: w.phone,
          rank: w.rank,
          claimed: !!w.claimed,
          name: w.name || (matchedUser ? matchedUser.name : `Winner #${w.rank}`),
          profilePicture: w.profilePicture || (matchedUser ? matchedUser.profilePicture : ''),
          level: w.level || (matchedUser ? matchedUser.level : 1),
          amt: w.amt !== undefined ? w.amt : (matchedUser ? matchedUser.amt : 0),
          fifteenDayAmt: w.fifteenDayAmt !== undefined ? w.fifteenDayAmt : (matchedUser ? matchedUser.fifteenDayAmt : 0),
          prize: w.prize || defaultPrizes[rank] || ''
        };
      });
    }

    // Strip phone numbers from public leaderboard data
    data = uniqueLeaders.map(u => ({
      name: u.name,
      level: u.level,
      amt: u.amt,
      fifteenDayAmt: u.fifteenDayAmt,
      profilePicture: u.profilePicture
    }));

    console.timeEnd("processing");

    // Include cycle info in the response
    const responseData = {
      leaderboard: data,
      cycleEndDate: cycleEndDate,
      winners: cycleWinners
    };

    console.time("response");

    const res = Response.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    console.timeEnd("response");
    return res;

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
