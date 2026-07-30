const mongoose = require('mongoose');
const fs = require('fs');

let envStr = fs.readFileSync('.env', 'utf8').split('\n').find(line => line.startsWith('MONGODB_URI=')).split('=')[1].trim();
if (envStr.startsWith('"') && envStr.endsWith('"')) {
  envStr = envStr.substring(1, envStr.length - 1);
}
envStr = envStr.replace('&ssl', '').replace('?ssl', '');

async function testTeam() {
  try {
    await mongoose.connect(envStr);
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const userId = '03470180675';
    const user = await User.findOne({ phone: userId }).select('phone customDirectReferrals customIndirectReferrals referralCommission').lean();
    console.log("User found:", user ? user.phone : null);
    
    if (!user) return;

    const levelAMembers = await User.find({ referredBy: user.phone, 'investmentPlans.status': 'active' }).select('name phone email balance earnBalance createdAt investmentPlans.status investmentPlans.planName').lean();
    console.log("Level A members:", levelAMembers.length);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}
testTeam();
