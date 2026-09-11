import mongoose from 'mongoose';

const DEFAULT_PRIMARY_URI = 'mongodb://dk3205997146:Daniyal123@ac-snk8ltk-shard-00-00.githyp3.mongodb.net:27017/hmh?ssl=true&authSource=admin&directConnection=true';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_PRIMARY_URI;

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
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 5000
  };

  const connectWithFallback = async () => {
    try {
      return await mongoose.connect(MONGODB_URI, opts);
    } catch (err) {
      console.warn('[MongoDB] Primary URI connection failed, attempting direct connection fallback...', err.message);
      if (!MONGODB_URI.includes('directConnection=true')) {
        return await mongoose.connect(DEFAULT_PRIMARY_URI, opts);
      }
      throw err;
    }
  };

  cached.promise = connectWithFallback().then((m) => {
    console.log('[MongoDB] Connected successfully to Atlas ✅');
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
