import { authenticate } from "../middleware/authenticate";
import { Router, Request, Response } from "express";
import crypto from "crypto";
import { pool } from "../db";
import { validateBody } from "../middleware/validate";
import { signupSchema, loginSchema } from "../schemas/auth.schema";
import { hashPassword, comparePassword } from "../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

const router = Router();

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches JWT_REFRESH_EXPIRY

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/auth", // only sent to auth routes (refresh/logout), not every request
  });
}

/**
 * Creates a session row + signs both tokens for a given user.
 * Shared by signup and login.
 */
async function issueTokens(
  userId: string,
  email: string,
  req: Request
): Promise<{ accessToken: string; refreshToken: string }> {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ userId, sessionId });
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_COOKIE_MAX_AGE_MS);

  await pool.query(
    `INSERT INTO sessions (id, user_id, refresh_token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [sessionId, userId, refreshTokenHash, req.headers["user-agent"] || null, req.ip, expiresAt]
  );

  const accessToken = signAccessToken({ userId, email });
  return { accessToken, refreshToken };
}

// POST /auth/signup
router.post("/signup", validateBody(signupSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: { message: "Email already in use" } });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, username`,
      [email, name, passwordHash]
    );
    const user = result.rows[0];

    const { accessToken, refreshToken } = await issueTokens(user.id, user.email, req);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT id, email, username, password_hash FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const validPassword = await comparePassword(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: { message: "Invalid email or password" } });
    }

    const { accessToken, refreshToken } = await issueTokens(user.id, user.email, req);
    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post("/refresh", async (req: Request, res: Response, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: { message: "Missing refresh token" } });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: { message: "Invalid or expired refresh token" } });
    }

    const tokenHash = hashToken(token);
    const sessionResult = await pool.query(
      `SELECT id, user_id, expires_at, revoked_at FROM sessions
       WHERE id = $1 AND refresh_token_hash = $2`,
      [payload.sessionId, tokenHash]
    );
    const session = sessionResult.rows[0];

    if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: { message: "Session no longer valid" } });
    }

    // Rotate: revoke the old session, issue a new one
    await pool.query("UPDATE sessions SET revoked_at = now() WHERE id = $1", [session.id]);

    const userResult = await pool.query("SELECT id, email FROM users WHERE id = $1", [
      session.user_id,
    ]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: { message: "User no longer exists" } });
    }

    const { accessToken, refreshToken } = await issueTokens(user.id, user.email, req);
    setRefreshCookie(res, refreshToken);

    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post("/logout", async (req: Request, res: Response, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      const tokenHash = hashToken(token);
      await pool.query(
        "UPDATE sessions SET revoked_at = now() WHERE refresh_token_hash = $1 AND revoked_at IS NULL",
        [tokenHash]
      );
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/auth" });
    res.status(200).json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
});
// GET /auth/me — quick smoke test for the authenticate middleware.
// Remove once a real protected route (e.g. rooms) exists to verify against instead.
router.get("/me", authenticate, (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});

export default router;
