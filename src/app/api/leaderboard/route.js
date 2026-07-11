import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import SystemSettings from '@/models/SystemSettings';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // 15 days in milliseconds
    const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
    
    // Check if we have a cached leaderboard
    let cachedLeaderboard = await SystemSettings.findOne({ key: 'leaderboard_v4' }).lean();
    let data = null;
    let shouldRecalculate = force || !cachedLeaderboard || !cachedLeaderboard.value;

    if (cachedLeaderboard && cachedLeaderboard.value) {
      const { lastUpdated, data: cachedData } = cachedLeaderboard.value;
      const age = Date.now() - new Date(lastUpdated).getTime();
      
      if (age < FIFTEEN_DAYS_MS) {
        data = cachedData;
      } else {
        shouldRecalculate = true;
      }
    }

    if (shouldRecalculate) {
      // Recalculate leaderboard
      // Query active, non-admin, non-blocked users
      const users = await User.find({ isAdmin: { $ne: true }, isBlocked: { $ne: true } })
        .select('-investmentPlans.screenshotData')
        .lean();
      
      // Calculate earnings and level for each user
      const realLeaders = users.map(user => {
        const level = (user.claimedLevels && user.claimedLevels.length > 0) ? Math.max(...user.claimedLevels) : 1;
        const amt = ((user.earnBalance || 0) + (user.totalCommissionEarned || 0)) / 300.0; // convert PKR to USD
        
        // format name to "Firstname L." format
        const nameParts = (user.name || '').trim().split(/\s+/);
        let displayName = user.name || 'Anonymous';
        if (nameParts.length > 1) {
          const firstName = nameParts[0];
          const lastInitial = nameParts[nameParts.length - 1][0].toUpperCase();
          displayName = `${firstName} ${lastInitial}.`;
        }
        
        return {
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

      data = uniqueLeaders;

      // Update cache in SystemSettings
      await SystemSettings.findOneAndUpdate(
        { key: 'leaderboard_v4' },
        {
          value: {
            lastUpdated: new Date(),
            data
          },
          description: 'Cached top 10 leaderboard updated every 15 days'
        },
        { upsert: true, new: true }
      );
    }

    return Response.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return Response.json([]);
  }
}
