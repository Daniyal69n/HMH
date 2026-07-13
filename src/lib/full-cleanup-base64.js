/**
 * Cleanup Script: Remove all base64 images from MongoDB
 * Run once after deployment to free up space
 * 
 * Usage: npx node src/lib/full-cleanup-base64.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

const mongoose = require('mongoose');

async function cleanupAllBase64() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not set');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Define schemas for cleanup
    const userSchema = new mongoose.Schema({}, { strict: false });
    const productSchema = new mongoose.Schema({}, { strict: false });
    const orderSchema = new mongoose.Schema({}, { strict: false });
    const settingsSchema = new mongoose.Schema({}, { strict: false });

    const User = mongoose.model('User', userSchema);
    const Product = mongoose.model('Product', productSchema);
    const Order = mongoose.model('Order', orderSchema);
    const SystemSettings = mongoose.model('SystemSettings', settingsSchema);

    console.log('\n📋 Cleanup Plan:');
    console.log('1. Remove base64 from User.profilePicture');
    console.log('2. Remove base64 from User.investmentPlans[].screenshotData');
    console.log('3. Remove base64 from Product.image and Product.images[]');
    console.log('4. Remove base64 from Order.receiptImage');
    console.log('5. Remove base64 from SystemSettings.carouselImages');

    let totalCleaned = 0;

    // ─── 1. Clean Users: profilePicture ───
    console.log('\n🧹 Cleaning Users.profilePicture...');
    const usersWithBase64ProfilePic = await User.find({
      profilePicture: { $regex: '^data:image' }
    }).select('_id phone name profilePicture').lean();

    if (usersWithBase64ProfilePic.length > 0) {
      await User.updateMany(
        { profilePicture: { $regex: '^data:image' } },
        { $set: { profilePicture: '' } }
      );
      console.log(`  ✅ Cleaned ${usersWithBase64ProfilePic.length} profiles`);
      totalCleaned += usersWithBase64ProfilePic.length;
    } else {
      console.log('  ✓ No base64 profile pictures found');
    }

    // ─── 2. Clean Users: investmentPlans[].screenshotData ───
    console.log('\n🧹 Cleaning Users.investmentPlans[].screenshotData...');
    const users = await User.find({
      'investmentPlans.screenshotData': { $exists: true }
    }).select('_id phone name investmentPlans').lean();

    let screenshotCleaned = 0;
    for (const user of users) {
      const hasBase64 = user.investmentPlans?.some(p => 
        p.screenshotData && p.screenshotData.startsWith('data:image')
      );
      
      if (hasBase64) {
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              'investmentPlans.$[elem].screenshotData': null
            }
          },
          { arrayFilters: [{ 'elem.screenshotData': { $regex: '^data:image' } }] }
        );
        screenshotCleaned++;
      }
    }
    
    if (screenshotCleaned > 0) {
      console.log(`  ✅ Cleaned ${screenshotCleaned} investment plans`);
      totalCleaned += screenshotCleaned;
    } else {
      console.log('  ✓ No base64 screenshots found');
    }

    // ─── 3. Clean Products: image and images[] ───
    console.log('\n🧹 Cleaning Products.image and images[]...');
    const productsWithBase64 = await Product.find({
      $or: [
        { image: { $regex: '^data:image' } },
        { images: { $elemMatch: { $regex: '^data:image' } } }
      ]
    }).select('_id name image images').lean();

    if (productsWithBase64.length > 0) {
      for (const product of productsWithBase64) {
        const updates = {};
        
        if (product.image && product.image.startsWith('data:image')) {
          updates.image = '';
        }
        
        if (product.images && Array.isArray(product.images)) {
          updates.images = product.images.filter(img => 
            !img.startsWith('data:image')
          );
        }

        await Product.updateOne({ _id: product._id }, { $set: updates });
      }
      console.log(`  ✅ Cleaned ${productsWithBase64.length} products`);
      totalCleaned += productsWithBase64.length;
    } else {
      console.log('  ✓ No base64 product images found');
    }

    // ─── 4. Clean Orders: receiptImage ───
    console.log('\n🧹 Cleaning Orders.receiptImage...');
    const ordersWithBase64 = await Order.find({
      receiptImage: { $regex: '^data:image' }
    }).select('_id productName receiptImage').lean();

    if (ordersWithBase64.length > 0) {
      await Order.updateMany(
        { receiptImage: { $regex: '^data:image' } },
        { $set: { receiptImage: '' } }
      );
      console.log(`  ✅ Cleaned ${ordersWithBase64.length} orders`);
      totalCleaned += ordersWithBase64.length;
    } else {
      console.log('  ✓ No base64 receipt images found');
    }

    // ─── 5. Clean SystemSettings: carouselImages ───
    console.log('\n🧹 Cleaning SystemSettings.carouselImages...');
    const settings = await SystemSettings.findOne({});
    if (settings && settings.carouselImages) {
      let cleanedCarousel = false;
      const cleanedImages = {};
      
      for (const [key, value] of Object.entries(settings.carouselImages)) {
        if (value && value.data && value.data.startsWith('data:image')) {
          cleanedCarousel = true;
          // Remove base64 carousel image
        } else if (value && value.url) {
          // Keep URL-based carousel images
          cleanedImages[key] = { url: value.url, uploadedAt: value.uploadedAt };
        }
      }

      if (cleanedCarousel) {
        await SystemSettings.updateOne(
          { _id: settings._id },
          { $set: { carouselImages: cleanedImages } }
        );
        console.log(`  ✅ Cleaned carousel images`);
        totalCleaned += 1;
      } else {
        console.log('  ✓ No base64 carousel images found');
      }
    } else {
      console.log('  ✓ No carousel images found');
    }

    // ─── Summary ───
    console.log('\n' + '='.repeat(50));
    console.log(`✅ CLEANUP COMPLETE!`);
    console.log(`Total items cleaned: ${totalCleaned}`);
    console.log('='.repeat(50));
    console.log('\n📊 Your MongoDB is now optimized!');
    console.log('💾 Database size should be significantly reduced');
    console.log('⚡ Queries will be much faster');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  cleanupAllBase64();
}

module.exports = cleanupAllBase64;
