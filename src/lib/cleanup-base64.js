/**
 * One-time cleanup script to remove base64 images from MongoDB
 * Run once after deployment: npx node src/lib/cleanup-base64.js
 */

const mongoose = require('mongoose');

// Product schema
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  currency: String,
  image: String,
  images: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
});

const Product = mongoose.model('Product', productSchema);

async function cleanupBase64() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not set');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find and clean products with base64 images
    const products = await Product.find({
      $or: [
        { image: { $regex: '^data:image' } },
        { images: { $elemMatch: { $regex: '^data:image' } } }
      ]
    });

    console.log(`Found ${products.length} products with base64 images`);

    for (const product of products) {
      // Remove base64 from main image
      if (product.image && product.image.startsWith('data:image')) {
        product.image = '';
      }

      // Remove base64 from images array
      if (Array.isArray(product.images)) {
        product.images = product.images.filter(img => !img.startsWith('data:image'));
      }

      await product.save();
      console.log(`✓ Cleaned product: ${product.name}`);
    }

    console.log(`✓ Cleanup complete! Cleaned ${products.length} products`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupBase64();
}

export default cleanupBase64;
