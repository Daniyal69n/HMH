import mongoose from 'mongoose';
import dns from 'dns';

// Force Google DNS to resolve MongoDB SRV records reliably
// (ISP DNS often blocks or times out mongodb.net SRV lookups)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless function executions in production.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If already connected and connection is active (readyState === 1), reuse connection immediately
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a stale/disconnected connection exists, clear it
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null;
    cached.promise = null;
  }

  // If connecting promise is active (readyState === 2), await it
  if (cached.promise && mongoose.connection.readyState === 2) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      cached.promise = null;
    }
  }

  const opts = {
    maxPoolSize: 5,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
  };

  cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
    console.log('[MongoDB] Connected successfully ✅');
    return m;
  }).catch((err) => {
    console.error('[MongoDB] Connection error:', err.message);
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
