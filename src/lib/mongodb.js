import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dk3205997146:<db_password>@ai.githyp3.mongodb.net/?appName=Ai';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;
let lastConnectionAttemptTime = 0;
let connectionFailureCount = 0;
const RETRY_DELAY_MS = 30000; // Wait 30 seconds between retry attempts
const MAX_RETRIES_BEFORE_DELAY = 1; // After 1 failure, start waiting

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If already connected, return immediately
  if (cached.conn) {
    return cached.conn;
  }

  // Prevent hammering MongoDB with connection attempts
  const now = Date.now();
  if (lastConnectionAttemptTime && (now - lastConnectionAttemptTime) < RETRY_DELAY_MS) {
    if (connectionFailureCount > MAX_RETRIES_BEFORE_DELAY) {
      const waitTime = Math.ceil((RETRY_DELAY_MS - (now - lastConnectionAttemptTime)) / 1000);
      console.warn(`[MongoDB] Skipping connection attempt (${waitTime}s cooldown to save credits)`);
      throw new Error('MongoDB offline - retrying later');
    }
  }

  if (!cached.promise) {
    lastConnectionAttemptTime = now;
    
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000, // Increased for heavy aggregations
      connectTimeoutMS: 10000,
    };

    console.log('[MongoDB] Attempting to connect...');

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('[MongoDB] Connected successfully ✅');
        connectionFailureCount = 0; // Reset on success
        return mongoose;
      })
      .catch((error) => {
        connectionFailureCount++;
        console.warn(`[MongoDB] Connection failed (attempt ${connectionFailureCount}):`, error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export { connectDB }; 
