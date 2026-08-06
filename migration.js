import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Provide __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

import User from './src/models/User.js';

async function runMigration() {
  try {
    let MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      const fs = (await import('fs')).default;
      if (fs.existsSync('.env')) {
        MONGODB_URI = fs.readFileSync('.env', 'utf8').split('\n').find(line => line.startsWith('MONGODB_URI=')).split('=')[1].trim();
        if (MONGODB_URI.startsWith('"') && MONGODB_URI.endsWith('"')) {
          MONGODB_URI = MONGODB_URI.substring(1, MONGODB_URI.length - 1);
        }
      } else {
        throw new Error('Please define the MONGODB_URI environment variable');
      }
    }
    
    // Strip out invalid ssl param
    MONGODB_URI = MONGODB_URI.replace('&ssl', '').replace('?ssl', '');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    console.log('Fetching users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    let updated = 0;
    for (const user of users) {
      // Sync totalAdWatchDays with adWatchDaysLeft if total is less than left
      const left = user.adWatchDaysLeft || 0;
      const total = user.totalAdWatchDays || 0;

      if (total < left) {
        user.totalAdWatchDays = left;
        await user.save();
        updated++;
      }
    }

    console.log(`Migration complete. Updated ${updated} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
