const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://dk3205997146:Daniyal123@ac-snk8ltk-shard-00-00.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-01.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-02.githyp3.mongodb.net:27017/?ssl=true&replicaSet=atlas-1drj90-shard-0&authSource=admin&retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const products = await db.collection('products').find({ isActive: true }).toArray();
  console.log(`Total active products: ${products.length}`);
  let totalSize = 0;
  products.forEach((p, idx) => {
    const size = Buffer.byteLength(JSON.stringify(p));
    console.log(`Product ${idx + 1}: name="${p.name}", size=${(size / 1024 / 1024).toFixed(2)} MB`);
    if (p.image) {
      console.log(`  image length: ${(p.image.length / 1024 / 1024).toFixed(2)} MB`);
    }
    if (p.images) {
      console.log(`  images array count: ${p.images.length}, total lengths: ${(p.images.reduce((sum, img) => sum + img.length, 0) / 1024 / 1024).toFixed(2)} MB`);
    }
    totalSize += size;
  });
  console.log(`Total payload size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  process.exit(0);
}

main();
