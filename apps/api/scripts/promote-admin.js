#!/usr/bin/env node
/**
 * Promote a user to admin role.
 * Usage: node scripts/promote-admin.js <email>
 * Or: pnpm --filter preplai-api exec node scripts/promote-admin.js <email>
 */
import 'dotenv/config';
import { connectDb, closeDb, User } from '../src/db.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/promote-admin.js <email>');
  process.exit(1);
}

async function main() {
  await connectDb();
  const user = await User.findOneAndUpdate(
    { email },
    { role: 'admin' },
    { new: true }
  );
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }
  console.log(`Promoted ${email} to admin`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
