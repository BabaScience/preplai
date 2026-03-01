/**
 * @preplai/db — MongoDB connection
 */
import mongoose from 'mongoose';

let connected = false;

export async function connectDb(uri?: string): Promise<typeof mongoose> {
  const mongoUri = uri ?? process.env.MONGODB_URI ?? 'mongodb://localhost:27017/preplai';
  if (connected) {
    return mongoose;
  }
  await mongoose.connect(mongoUri);
  connected = true;
  return mongoose;
}

export async function closeDb(): Promise<void> {
  if (connected) {
    await mongoose.disconnect();
    connected = false;
  }
}
