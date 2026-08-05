require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const fetch = require('node-fetch') || globalThis.fetch;

async function migrateProfilePictures() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  console.log('Connected to MongoDB.');

  const usersWithDp = await usersCollection.find({ 
    profilePicture: { $exists: true, $ne: '' } 
  }).toArray();

  console.log(`Found ${usersWithDp.length} users with a profile picture.`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const user of usersWithDp) {
    if (user.profilePicture && user.profilePicture.startsWith('data:image')) {
      try {
        const formData = new URLSearchParams();
        formData.append('file', user.profilePicture);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'product_images');

        const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        
        if (result.secure_url) {
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { profilePicture: result.secure_url } }
          );
          migratedCount++;
          console.log(`Migrated user ${user.phone}`);
        } else {
          console.error(`Failed to upload for user ${user.phone}:`, result);
          errorCount++;
        }
      } catch (err) {
        console.error(`Error migrating user ${user.phone}:`, err.message);
        errorCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log(`\nMigration Complete:`);
  console.log(`- Migrated: ${migratedCount}`);
  console.log(`- Skipped (Already URL): ${skippedCount}`);
  console.log(`- Errors: ${errorCount}`);

  process.exit(0);
}

migrateProfilePictures().catch(console.error);
