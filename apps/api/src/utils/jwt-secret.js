const DEV_SECRET = 'preplai-dev-secret-change-in-prod';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEV_SECRET) {
      throw new Error(
        'JWT_SECRET must be set to a secure value in production. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }
  }
  return secret || DEV_SECRET;
}

export const JWT_SECRET = getJwtSecret();
