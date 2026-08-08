const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error("No MONGODB_URI in env");
    return;
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  // Load models
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const SystemSettings = mongoose.models.SystemSettings || mongoose.model('SystemSettings', new mongoose.Schema({}, { strict: false }), 'systemsettings');
  const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }), 'transactions');

  // Let's check some users and their sizes
  const users = await User.find({}).lean();
  console.log(`Total users in DB: ${users.length}`);

  let maxProfileSize = 0;
  let maxProfileUser = null;
  let totalProfileSize = 0;

  for (const u of users) {
    const jsonStr = JSON.stringify(u);
    const size = jsonStr.length;
    totalProfileSize += size;
    if (size > maxProfileSize) {
      maxProfileSize = size;
      maxProfileUser = u;
    }
  }

  console.log(`Average profile document size: ${(totalProfileSize / users.length / 1024).toFixed(2)} KB`);
  if (maxProfileUser) {
    console.log(`Max profile document size: ${(maxProfileSize / 1024).toFixed(2)} KB (User: ${maxProfileUser.phone || maxProfileUser.name})`);
    // Let's print sizes of key fields in the max profile user
    const fields = {};
    for (const key of Object.keys(maxProfileUser)) {
      fields[key] = JSON.stringify(maxProfileUser[key]).length;
    }
    console.log("Fields in max user by size (bytes):", Object.entries(fields).sort((a, b) => b[1] - a[1]).slice(0, 10));
  }

  // Let's check SystemSettings for mystery_box_cycle
  const cycle = await SystemSettings.findOne({ key: 'mystery_box_cycle' }).lean();
  if (cycle) {
    const size = JSON.stringify(cycle).length;
    console.log(`mystery_box_cycle setting size: ${(size / 1024).toFixed(2)} KB`);
    if (cycle.value && cycle.value.winners) {
      console.log(`Winners count: ${cycle.value.winners.length}`);
      console.log(`Winners size: ${JSON.stringify(cycle.value.winners).length} bytes`);
    }
  }

  // Let's mock a leaderboard call and check its size
  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const cycleEndDate = cycle && cycle.value ? new Date(cycle.value.cycleEndDate) : new Date(Date.now() + FIFTEEN_DAYS_MS);
  const cycleStartDate = new Date(cycleEndDate.getTime() - FIFTEEN_DAYS_MS);

  const fifteenDayEarnings = await Transaction.aggregate([
    {
      $match: {
        status: { $in: ['completed', 'approved'] },
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

  const topUsers = await User.aggregate([
    { $match: { isAdmin: { $ne: true }, isBlocked: { $ne: true } } },
    {
      $project: {
        _id: 0,
        name: 1,
        phone: 1,
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
    const amt = user.computedEarnings / 300.0;
    const fifteenDayPKR = fifteenDayMap[user.phone] || 0;
    const fifteenDayAmt = fifteenDayPKR / 300.0;
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

  realLeaders.sort((a, b) => {
    if (b.fifteenDayAmt !== a.fifteenDayAmt) {
      return b.fifteenDayAmt - a.fifteenDayAmt;
    }
    return b.amt - a.amt;
  });

  const uniqueLeaders = [];
  const seenNames = new Set();
  for (const u of realLeaders) {
    if (!seenNames.has(u.name)) {
      seenNames.add(u.name);
      uniqueLeaders.push(u);
    }
    if (uniqueLeaders.length === 10) break;
  }

  let data = uniqueLeaders.map(u => ({
    name: u.name,
    level: u.level,
    amt: u.amt,
    fifteenDayAmt: u.fifteenDayAmt,
    profilePicture: u.profilePicture
  }));

  const responseData = {
    leaderboard: data,
    cycleEndDate: cycleEndDate,
    winners: cycle && cycle.value ? cycle.value.winners : []
  };

  const responseSize = JSON.stringify(responseData).length;
  console.log(`Mock Leaderboard response size: ${(responseSize / 1024).toFixed(2)} KB`);

  await mongoose.disconnect();
}

run().catch(console.error);
