import mongoose from 'mongoose';

/**
 * Convert string ID to mongoose ObjectId. Pass-through if already ObjectId.
 */
export function toObjectId(id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

export function paginate(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return { offset, limit };
}

export function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

export function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
