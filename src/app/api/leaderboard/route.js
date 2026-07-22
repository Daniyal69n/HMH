import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import SystemSettings from '@/models/SystemSettings';

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

    // Always fetch dynamic leaderboard using MongoDB aggregation for performance
    console.log("[Leaderboard] Fetching users via aggregation...");
    console.time("query2");

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
      },
      { $match: { computedEarnings: { $gt: 0 } } },
      { $sort: { computedEarnings: -1 } },
      { $limit: 100 } // Fetch top 100 to find top 10 unique names
    ]);

    console.timeEnd("query2");

    console.time("processing");
    const realLeaders = topUsers.map(user => {
      const level = (user.claimedLevels && user.claimedLevels.length > 0) ? Math.max(...user.claimedLevels) : 1;
      const amt = user.computedEarnings / 300.0; // convert PKR to USD

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
        profilePicture: user.profilePicture || ''
      };
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
      // Pick top 3 winners with their ranks
      const top3 = uniqueLeaders.slice(0, 3).map((u, index) => ({
        phone: u.phone,
        rank: index + 1,
        claimed: false
      }));
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

    // Strip phone numbers from public leaderboard data
    data = uniqueLeaders.map(u => ({
      name: u.name,
      level: u.level,
      amt: u.amt,
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
