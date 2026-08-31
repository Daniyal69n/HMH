import mongoose from 'mongoose';

async function test() {
  try {
    await mongoose.connect('mongodb://dk3205997146:Daniyal123@ac-snk8ltk-shard-00-00.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-01.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-02.githyp3.mongodb.net:27017/hmh?ssl=true&replicaSet=atlas-snk8ltk-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Ai');
    console.log("Connected");
    const db = mongoose.connection.db;
    const User = db.collection('users');

    const lastUser = await User.find({ shortId: { $regex: '^HMH\\d+$' } })
      .sort({ shortId: -1 })
      .limit(1)
      .toArray();
    console.log("String sort result:", lastUser.map(u => u.shortId));

    const maxUserAggr = await User.aggregate([
      { $match: { shortId: { $regex: '^HMH\\d+$' } } },
      { $project: {
          shortId: 1,
          num: { $toInt: { $substrCP: ["$shortId", 3, 20] } }
      }},
      { $sort: { num: -1 } },
      { $limit: 1 }
    ]).toArray();
    
    console.log("Aggregate result:", maxUserAggr.map(u => ({ id: u.shortId, num: u.num })));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
test();
