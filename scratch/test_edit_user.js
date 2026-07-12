const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://dk3205997146:Daniyal123@ac-snk8ltk-shard-00-00.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-01.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-02.githyp3.mongodb.net:27017/?ssl=true&replicaSet=atlas-1drj90-shard-0&authSource=admin&retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(MONGODB_URI);
  
  // Define a simple schema or import the model
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const user = await User.findOne({ phone: '1122334455' });
  if (!user) {
    console.log('User not found');
    process.exit(1);
  }
  
  console.log('User found:', user.name);
  
  try {
    // Try to update some fields and save to check if there are validation errors
    user.name = 'sadeed';
    user.customTotalEarnings = null;
    user.customMySalary = null;
    user.customTotalWithdrawals = null;
    user.customDirectReferrals = null;
    user.customIndirectReferrals = null;
    
    await user.save();
    console.log('User updated successfully via save()!');
  } catch (error) {
    console.error('Error during save():', error);
  }
  
  process.exit(0);
}

main();
