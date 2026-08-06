import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://dk3205997146:Daniyal123@ac-snk8ltk-shard-00-00.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-01.githyp3.mongodb.net:27017,ac-snk8ltk-shard-00-02.githyp3.mongodb.net:27017/hmh?ssl=true&replicaSet=atlas-snk8ltk-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Ai';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless function executions in production.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

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
    bufferCommands: false,
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    family: 4, // Force IPv4
    tls: true, // Explicitly enable TLS to prevent SSL alert 80
    serverApi: { version: '1', strict: true, deprecationErrors: true } // Ensures stable Atlas routing for serverless
  };

  cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
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
