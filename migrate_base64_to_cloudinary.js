const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function uploadBase64(base64Str, folderName) {
  if (!base64Str.startsWith('data:image')) return null;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary credentials missing in environment variables.');
  }

  const formData = new FormData();
  formData.append('file', base64Str);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folderName);
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }
  
  const data = await res.json();
  return data.secure_url;
}

async function runMigration() {
  console.log('Starting migration...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const users = await db.collection('users').find({}).toArray();

  let totalUsersScanned = 0;
  let imagesMigrated = 0;
  let imagesSkipped = 0;
  let failedUploads = 0;

  for (const u of users) {
    totalUsersScanned++;
    let updated = false;
    let updateDoc = { $set: {} };

    // 1. Migrate profilePicture
    if (u.profilePicture && typeof u.profilePicture === 'string') {
      if (u.profilePicture.startsWith('data:image')) {
        try {
          const url = await uploadBase64(u.profilePicture, 'profile-pictures');
          if (url) {
            updateDoc.$set.profilePicture = url;
            updated = true;
            imagesMigrated++;
          }
        } catch (err) {
          failedUploads++;
          console.error(`Failed to upload profilePicture for user ${u._id}:`, err.message);
        }
      } else if (u.profilePicture.startsWith('http')) {
        imagesSkipped++;
      }
    }

    // 2. Migrate socialTaskSubmissions
    if (Array.isArray(u.socialTaskSubmissions)) {
      let arrayUpdated = false;
      const newSubmissions = [];
      
      for (const sub of u.socialTaskSubmissions) {
        if (sub.screenshotBase64 && typeof sub.screenshotBase64 === 'string') {
          if (sub.screenshotBase64.startsWith('data:image')) {
            try {
              const url = await uploadBase64(sub.screenshotBase64, 'social-tasks');
              if (url) {
                sub.screenshotBase64 = url;
                arrayUpdated = true;
                imagesMigrated++;
              }
            } catch (err) {
              failedUploads++;
              console.error(`Failed to upload socialTask submission for user ${u._id}:`, err.message);
            }
          } else if (sub.screenshotBase64.startsWith('http')) {
            imagesSkipped++;
          }
        }
        newSubmissions.push(sub);
      }
      
      if (arrayUpdated) {
        updateDoc.$set.socialTaskSubmissions = newSubmissions;
        updated = true;
      }
    }

    // Apply updates if any fields were migrated for this user
    if (updated) {
      await db.collection('users').updateOne({ _id: u._id }, updateDoc);
      console.log(`Successfully migrated images for user: ${u._id}`);
    }
  }

  console.log('\n--- MIGRATION RESULTS ---');
  console.log(`Total users scanned: ${totalUsersScanned}`);
  console.log(`Images migrated: ${imagesMigrated}`);
  console.log(`Images skipped: ${imagesSkipped}`);
  console.log(`Failed uploads: ${failedUploads}`);

  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration crashed:', err);
  process.exit(1);
});
