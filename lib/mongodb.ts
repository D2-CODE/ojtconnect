/**
 * Mongoose connection singleton for OJT Connect PH.
 *
 * Caches the connection promise on the Node.js global object so that
 * hot-reloads in Next.js dev mode don't create multiple open connections.
 */

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable in .env.local"
  );
}

// ---------------------------------------------------------------------------
// Global cache type augmentation
// ---------------------------------------------------------------------------
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

// ---------------------------------------------------------------------------
// Connection helper
// ---------------------------------------------------------------------------
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log("[MongoDB] Using cached connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,          // max connections kept open in pool
      minPoolSize: 1,           // keep at least 1 alive (avoids cold reconnect)
      serverSelectionTimeoutMS: 10000,  // fail fast if Atlas unreachable (10s)
      connectTimeoutMS: 10000,          // TCP connect timeout
      socketTimeoutMS: 45000,           // per-operation socket timeout
    };

    const uri = MONGODB_URI as string;
    const maskedUri = uri.replace(/:\/\/([^:]+):([^@]+)@/, "://<user>:<pass>@");
    console.log("[MongoDB] Starting connection to:", maskedUri);
    const startTime = Date.now();

    cached.promise = mongoose
      .connect(uri, opts)
      .then(async (mongooseInstance) => {
        cached.conn = mongooseInstance; // set early so re-entrant calls (e.g. seeder) use cached conn
        console.log(`[MongoDB] Connected successfully in ${Date.now() - startTime}ms`);
        if (process.env.SEED_DUMMY_DATA === "true") {
          console.log("[MongoDB] SEED_DUMMY_DATA=true, running seeder...");
          const seedStart = Date.now();
          const { seedDatabase } = await import("./seed");
          await seedDatabase();
          console.log(`[MongoDB] Seeder finished in ${Date.now() - seedStart}ms`);
        }
        return mongooseInstance;
      })
      .catch((err: unknown) => {
        cached.promise = null; // allow retry on next call
        console.error(`[MongoDB] Connection failed after ${Date.now() - startTime}ms:`, err);
        throw err;
      });
  } else {
    console.log("[MongoDB] Waiting for existing connection promise...");
  }

  console.log("[MongoDB] Awaiting connection...");
  cached.conn = await cached.promise;
  console.log("[MongoDB] Connection ready");
  return cached.conn;
}

export default connectDB;
