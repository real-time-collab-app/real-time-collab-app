import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hashes a plain-text password using bcrypt.
 * @param plainPassword - the raw password from the signup/login request
 * @returns a bcrypt hash safe to store in the database
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compares a plain-text password against a stored bcrypt hash.
 * @param plainPassword - the raw password submitted at login
 * @param hashedPassword - the hash stored in the database
 * @returns true if they match, false otherwise
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}