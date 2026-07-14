import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import SystemSettings from '@/models/SystemSettings';

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
    console.time("query1");
    let cycleState = await SystemSettings.findOne({ key: 'mystery_box_cycle' }).lean();
    console.timeEnd("query1");

    let cycleEndDate = null;
    let cycleWinners = [];
    
    if (!cycleState || !cycleState.value) {
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

    // Always fetch dynamic leaderboard
    console.time("query2");
    const users = await User.find({ isAdmin: { $ne: true }, isBlocked: { $ne: true } })
      .select('-investmentPlans.screenshotData')
      .lean();
    console.timeEnd("query2");
    
    console.time("processing");
    // Calculate earnings and level for each user
    const realLeaders = users.map(user => {
      const level = (user.claimedLevels && user.claimedLevels.length > 0) ? Math.max(...user.claimedLevels) : 1;
      
      const pkrEarnings = (user.customTotalEarnings !== undefined && user.customTotalEarnings !== null)
        ? user.customTotalEarnings
        : ((user.earnBalance || 0) + (user.totalCommissionEarned || 0));
        
      const amt = pkrEarnings / 300.0; // convert PKR to USD
      
      // format name to "Firstname L." format
      const nameParts = (user.name || '').trim().split(/\s+/);
      let displayName = user.name || 'Anonymous';
      if (nameParts.length > 1) {
        const firstName = nameParts[0];
        const lastInitial = nameParts[nameParts.length - 1][0].toUpperCase();
        displayName = `${firstName} ${lastInitial}.`;
      }
      
      return {
        phone: user.phone, // Include phone to identify winners
        name: displayName,
        level,
        amt,
        profilePicture: user.profilePicture || ''
      };
    }).filter(l => l.amt > 0); // only keep users with positive earnings
    
    // Sort real leaders by amount descending
    realLeaders.sort((a, b) => b.amt - a.amt);
    
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
    return Response.json([]);
  }
}
