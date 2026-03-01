import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, closeDb } from '../src/db.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await connectDb();
});

afterAll(async () => {
  await closeDb();
  if (mongod) await mongod.stop();
});
