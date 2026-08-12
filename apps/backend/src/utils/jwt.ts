import jwt, { SignOptions } from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRY = (process.env.JWT_ACCESS_EXPIRY ||
  "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY ||
  "7d") as SignOptions["expiresIn"];

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in the environment"
  );
}

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in the environment"
  );
}

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

/**
 * Signs a short-lived access token. Sent to the client in the response body,
 * held in memory, and attached as `Authorization: Bearer <token>` on requests.
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

/**
 * Signs a longer-lived refresh token. Sent to the client only via an
 * httpOnly cookie — never in the JSON response body.
 */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

/**
 * Verifies an access token. Throws if invalid or expired — callers
 * (e.g. the authenticate middleware) should catch and respond 401.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * Verifies a refresh token. Throws if invalid or expired.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}