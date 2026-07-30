const fs = require('fs');
let envStr = fs.readFileSync('.env', 'utf8').split('\n').find(line => line.startsWith('MONGODB_URI=')).split('=')[1].trim();
if (envStr.startsWith('"') && envStr.endsWith('"')) {
  envStr = envStr.substring(1, envStr.length - 1);
}
envStr = envStr.replace('&ssl', '').replace('?ssl', '');

const mongoose = require('mongoose');

async function testQuery() {
  try {
    await mongoose.connect(envStr);
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    console.log("Connected to MongoDB.");
    
    console.log("Running EXCLUDE query...");
    console.time("EXCLUDE");
    const users1 = await User.find({})
        .select('-password -investmentPlans.screenshotData -profilePicture -withdrawHistory -rechargeHistory -teamMembers')
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(1000)
        .lean();
    console.timeEnd("EXCLUDE");
    
    console.log("Running INCLUDE query...");
    console.time("INCLUDE");
    const users2 = await User.find({})
        .select('name phone email balance earnBalance totalCommissionEarned totalRecharge status isBlocked isAdmin createdAt referralCode investmentPlans.status investmentPlans.planName')
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(1000)
        .lean();
    console.timeEnd("INCLUDE");
        
    console.log(`Found ${users1.length} and ${users2.length} users.`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

testQuery();
