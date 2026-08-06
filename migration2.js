const fs = require('fs');
let envStr = fs.readFileSync('.env', 'utf8').split('\n').find(line => line.startsWith('MONGODB_URI=')).split('=')[1].trim();
if (envStr.startsWith('"') && envStr.endsWith('"')) {
  envStr = envStr.substring(1, envStr.length - 1);
}
// Strip out all query params
envStr = envStr.split('?')[0];

const mongoose = require('mongoose');

async function testQuery() {
  try {
    await mongoose.connect(envStr);
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    console.log("Connected to MongoDB.");
    
    console.log("Running migration...");
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
        
    console.log(`Migration complete. Updated ${updated} users.`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

testQuery();
