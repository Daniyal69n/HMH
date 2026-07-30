const fs = require('fs');
let envStr = fs.readFileSync('.env', 'utf8').split('\n').find(line => line.startsWith('MONGODB_URI=')).split('=')[1].trim();
if (envStr.startsWith('"') && envStr.endsWith('"')) {
  envStr = envStr.substring(1, envStr.length - 1);
}
// Strip out invalid ssl param
envStr = envStr.replace('&ssl', '').replace('?ssl', '');

const mongoose = require('mongoose');

async function testQuery() {
  try {
    await mongoose.connect(envStr);
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    console.log("Connected to MongoDB.");
    
    console.log("Running query...");
    const users = await User.find({})
        .select('-password -investmentPlans.screenshotData -profilePicture -withdrawHistory -rechargeHistory -teamMembers')
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(1000)
        .lean();
        
    console.log(`Found ${users.length} users.`);
    fs.writeFileSync('users_dump.json', JSON.stringify(users));
    console.log(`Dumped to users_dump.json, size: ${fs.statSync('users_dump.json').size} bytes`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

testQuery();
