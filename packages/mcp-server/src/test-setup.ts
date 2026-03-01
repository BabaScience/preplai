/**
 * MCP server test setup — starts MongoDB Memory Server (runs once per worker)
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb } from '@preplai/db';

let mongod: MongoMemoryServer;

export async function setup() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await connectDb();
}

export async function teardown() {
  const { closeDb } = await import('@preplai/db');
  await closeDb();
  if (mongod) await mongod.stop();
}
