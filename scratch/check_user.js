const mongoose = require('mongoose');

const uri = 'mongodb://dk3205997146:Daniyal123@ac-snk8ltk-shard-00-00.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-01.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-02.githyp3.mongodb.net:27017/hmh?ssl=true&replicaSet=atlas-snk8ltk-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Ai';

async function main() {
  try {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4, // Force IPv4
      tls: true,
    };
    await mongoose.connect(uri, opts);
    console.log("Connected to MongoDB.");

    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const TransactionSchema = new mongoose.Schema({}, { strict: false });
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

    // Search by name Alisha Fatima
    const user = await User.findOne({ name: /Alisha Fatima/i }).lean();
    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("Found user:", {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      customTotalEarnings: user.customTotalEarnings,
      earnBalance: user.earnBalance,
      totalCommissionEarned: user.totalCommissionEarned
    });

    // Check transactions where userId matches phone or _id (or string representation)
    const txs = await Transaction.find({
      userId: { $in: [user.phone, String(user._id), user._id] }
    }).lean();

    console.log(`Found ${txs.length} transactions for this user.`);
    if (txs.length > 0) {
      console.log("Transaction types & statuses:");
      const summary = {};
      txs.forEach(t => {
        const key = `${t.type} - ${t.status}`;
        summary[key] = (summary[key] || 0) + 1;
      });
      console.log(summary);
      
      console.log("Sample transactions (up to 5):", txs.slice(0, 5).map(t => ({
        type: t.type,
        amount: t.amount,
        status: t.status,
        userId: t.userId,
        createdAt: t.createdAt
      })));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
