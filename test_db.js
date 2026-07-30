const mongoose = require('mongoose');
const fs = require('fs');

async function testQuery() {
  try {
    await mongoose.connect("mongodb+srv://daniyal69n:P%40ki%24tan4@cluster0.hftif.mongodb.net/earning-platform?retryWrites=true&w=majority&appName=Cluster0");
    
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
