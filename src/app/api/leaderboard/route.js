import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import SystemSettings from '@/models/SystemSettings';
import Transaction from '@/models/Transaction';

let cachedLeaderboard = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms

export async function GET(request) {
  const now = Date.now();
  if (cachedLeaderboard && (now - lastCacheTime < CACHE_DURATION)) {
    return Response.json(cachedLeaderboard, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'HIT'
      }
    });
  }

  const tTotalStart = performance.now();
  try {
    const tConnectStart = performance.now();
    await connectDB();
    const connectTime = (performance.now() - tConnectStart).toFixed(2);

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // 15 days in milliseconds
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

    // Check cycle state
    const tSettingsStart = performance.now();
    let cycleState = await SystemSettings.findOne({ key: 'mystery_box_cycle' }).lean();
    const settingsTime = (performance.now() - tSettingsStart).toFixed(2);

    let cycleEndDate = null;
    let cycleWinners = [];

    if (!cycleState || !cycleState.value) {
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
    const tTxStart = performance.now();
    const fifteenDayEarnings = await Transaction.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'approved'] },
          type: { $in: ['daily_income', 'referral_income', 'coupon_redeem', 'signup_bonus', 'level_reward', 'social_task_reward', 'mystery_box_reward', 'bonus'] },
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
    const transactionsTime = (performance.now() - tTxStart).toFixed(2);

    const tUsersStart = performance.now();
    const topUsers = await User.aggregate([
      { $match: { isAdmin: { $ne: true }, isBlocked: { $ne: true } } },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          email: 1,
          profilePicture: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: "$profilePicture" }, "string"] },
                  { $lt: [{ $strLenCP: { $ifNull: ["$profilePicture", ""] } }, 1000] }
                ]
              },
              then: "$profilePicture",
              else: ""
            }
          },
          claimedLevels: 1,
          level: 1,
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
    const usersTime = (performance.now() - tUsersStart).toFixed(2);

    const tMapStart = performance.now();
    const fifteenDayMap = {};
    fifteenDayEarnings.forEach(item => {
      if (item._id) {
        fifteenDayMap[item._id] = item.total;
      }
    });

    const realLeaders = topUsers.map(user => {
      const claimLvl = (user.claimedLevels && user.claimedLevels.length > 0) ? Math.max(...user.claimedLevels) : 1;
      const dbLvl = user.level || 1;
      const level = Math.max(claimLvl, dbLvl);
      const amt = user.computedEarnings / 300.0; // convert PKR to USD
      
      const rawPhone = user.phone || '';
      const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      const userIdStr = user._id ? String(user._id) : '';
      const email = user.email || '';

      let fifteenDayPKR = 0;
      const keysToCheck = new Set();
      if (rawPhone) keysToCheck.add(rawPhone);
      if (cleanPhone) keysToCheck.add(cleanPhone);
      if (userIdStr) keysToCheck.add(userIdStr);
      if (email) keysToCheck.add(email);

      keysToCheck.forEach(key => {
        if (fifteenDayMap[key]) {
          fifteenDayPKR += fifteenDayMap[key];
        }
      });

      if (cleanPhone && cleanPhone.length >= 10) {
        const phoneSuffix = cleanPhone.slice(-10);
        Object.keys(fifteenDayMap).forEach(key => {
          const cleanKey = String(key).replace(/[^0-9]/g, '');
          if (cleanKey && cleanKey.length >= 10) {
            const keySuffix = cleanKey.slice(-10);
            if (phoneSuffix === keySuffix) {
              if (!keysToCheck.has(key)) {
                fifteenDayPKR += fifteenDayMap[key];
                keysToCheck.add(key);
              }
            }
          }
        });
      }

      const fifteenDayAmt = user.customTotalEarnings !== undefined && user.customTotalEarnings !== null
        ? Math.max(user.customTotalEarnings / 300.0, fifteenDayPKR / 300.0)
        : fifteenDayPKR / 300.0; // convert PKR to USD

      const displayName = user.name || 'Anonymous';

      return {
        phone: user.phone,
        name: displayName,
        level,
        amt,
        fifteenDayAmt,
        profilePicture: user.profilePicture || ''
      };
    });
    const mappingTime = (performance.now() - tMapStart).toFixed(2);

    const tSortStart = performance.now();
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
    const sortingTime = (performance.now() - tSortStart).toFixed(2);

    // Include cycle info in the response
    const responseData = {
      leaderboard: data,
      cycleEndDate: cycleEndDate,
      winners: cycleWinners
    };

    const tSerStart = performance.now();
    const totalTime = (performance.now() - tTotalStart).toFixed(2);
    const serializationTime = (performance.now() - tSerStart).toFixed(2);

    console.log(`[Leaderboard Audit] Connect: ${connectTime}ms | SystemSettings: ${settingsTime}ms | Transactions: ${transactionsTime}ms | Users: ${usersTime}ms | Mapping: ${mappingTime}ms | Sorting: ${sortingTime}ms | Serialization: ${serializationTime}ms | Total: ${totalTime}ms`);

    cachedLeaderboard = responseData;
    lastCacheTime = Date.now();

    return Response.json(responseData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Connect-Time': `${connectTime}ms`,
        'X-SystemSettings-Time': `${settingsTime}ms`,
        'X-Transactions-Time': `${transactionsTime}ms`,
        'X-Users-Time': `${usersTime}ms`,
        'X-Mapping-Time': `${mappingTime}ms`,
        'X-Sorting-Time': `${sortingTime}ms`,
        'X-Serialization-Time': `${serializationTime}ms`,
        'X-Total-Time': `${totalTime}ms`,
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
