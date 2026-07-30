require('dotenv').config();
const mongoose = require('mongoose');

async function testQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Import User model (simplified for test)
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    console.log("Connected to MongoDB.");
    
    // Try the query
    console.log("Running query...");
    const users = await User.find({})
        .select('-password -investmentPlans.screenshotData -profilePicture -withdrawHistory -rechargeHistory -teamMembers')
        .sort({ createdAt: -1 })
        .skip(0)
        .limit(1000)
        .lean();
        
    console.log(`Found ${users.length} users.`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

testQuery();
