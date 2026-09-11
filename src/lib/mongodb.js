import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If connection is truly active, reuse it
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is stale (disconnected/closing), fully reset it
  if (mongoose.connection.readyState !== 2) {
    cached.conn = null;
    cached.promise = null;
    // Ensure mongoose doesn't hold onto a dead connection
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch (_) {}
  }

  // If there's already a pending connect promise (readyState === 2), reuse it
  if (cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      cached.promise = null;
      cached.conn = null;
    }
  }

  // Serverless-optimized connection options
  const opts = {
    maxPoolSize: 10,         // Allow concurrent API requests without starving the pool
    minPoolSize: 0,          // Don't hold idle connections
    maxIdleTimeMS: 10000,    // Close connections idle for 10 seconds
    serverSelectionTimeoutMS: 20000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 20000,
    heartbeatFrequencyMS: 5000,
  };

  cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
    console.log('[MongoDB] Connected ✅');
    return m;
  }).catch((err) => {
    console.error('[MongoDB] Connection failed:', err.message);
    cached.promise = null;
    cached.conn = null;
    throw err;
  });

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    throw e;
  }

  return cached.conn;
}

export { connectDB };
