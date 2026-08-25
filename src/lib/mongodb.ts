import mongoose from "mongoose";

/**
 * Next.js hot-reloads modules in dev and runs many isolated lambda invocations in
 * production, so a naive `mongoose.connect()` per request exhausts the Atlas
 * connection pool. Cache the connection promise on globalThis instead.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { _mongoose?: MongooseCache };

const cached: MongooseCache = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cached;

export class MissingMongoUriError extends Error {
  constructor() {
    super(
      "MONGODB_URI is not set. Copy .env.example to .env.local and paste your MongoDB Atlas connection string.",
    );
    this.name = "MissingMongoUriError";
  }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  // Read at call time, not module scope: ES imports are hoisted above the
  // dotenv call in scripts like `npm run seed`, so a top-level read sees undefined.
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<user>")) {
    throw new MissingMongoUriError();
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error) => {
        // Clear the cached promise so the next request can retry instead of
        // permanently resolving to a rejected promise.
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
