const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function runExplain() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  
  const User = require('./src/models/User').default || require('./src/models/User');
  
  // Total documents in collection
  const totalUsers = await mongoose.connection.db.collection('users').countDocuments();
  console.log("Total users in collection:", totalUsers);
  
  const pipeline = [
    { $match: { isAdmin: { $ne: true }, isBlocked: { $ne: true } } },
    {
      $project: {
        _id: 0,
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
  ];

  // We have to use the db.collection().aggregate().explain() or User.aggregate().explain()
  let explainStats;
  try {
     const commandResult = await mongoose.connection.db.command({
       explain: { 
         aggregate: 'users', 
         pipeline: pipeline, 
         cursor: {} 
       }, 
       verbosity: 'executionStats' 
     });
     console.log(JSON.stringify(commandResult, null, 2));
  } catch (err) {
     console.log("Error running explain:", err.message);
  }
  
  process.exit(0);
}

runExplain().catch(console.error);
