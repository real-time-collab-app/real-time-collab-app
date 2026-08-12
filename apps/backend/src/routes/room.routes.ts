import { Router } from "express";
import { pool } from "../db";
import { authenticate } from "../middleware/authenticate";
import { validateBody } from "../middleware/validate";
import { createRoomSchema, updateRoomSchema } from "../schemas/room.schema";

const router = Router();

// All room routes require a logged-in user
router.use(authenticate);

// CREATE a room
router.post("/", validateBody(createRoomSchema), async (req, res, next) => {
  const { name } = req.body;
  const userId = req.user!.userId;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const roomResult = await client.query(
      "INSERT INTO rooms (name, created_by) VALUES ($1, $2) RETURNING *",
      [name, userId]
    );
    const room = roomResult.rows[0];

    await client.query("INSERT INTO room_members (room_id, user_id, role) VALUES ($1, $2, $3)", [
      room.id,
      userId,
      "owner",
    ]);

    await client.query("COMMIT");
    res.status(201).json(room);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// LIST rooms the current user is a member of
router.get("/", async (req, res, next) => {
  const userId = req.user!.userId;
  try {
    const result = await pool.query(
      `SELECT rooms.* FROM rooms
       JOIN room_members ON room_members.room_id = rooms.id
       WHERE room_members.user_id = $1
       ORDER BY rooms.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET one room (only if the user is a member)
router.get("/:id", async (req, res, next) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT rooms.* FROM rooms
       JOIN room_members ON room_members.room_id = rooms.id
       WHERE rooms.id = $1 AND room_members.user_id = $2`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: "Room not found" } });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// UPDATE a room (only the owner can rename it)
router.patch("/:id", validateBody(updateRoomSchema), async (req, res, next) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const { name } = req.body;
  try {
    const membership = await pool.query(
      "SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(404).json({ error: { message: "Room not found" } });
    }
    if (membership.rows[0].role !== "owner") {
      return res.status(403).json({ error: { message: "Only the owner can update this room" } });
    }

    const result = await pool.query(
      "UPDATE rooms SET name = $1, updated_at = now() WHERE id = $2 RETURNING *",
      [name, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE a room (only the owner can delete it)
router.delete("/:id", async (req, res, next) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  try {
    const membership = await pool.query(
      "SELECT role FROM room_members WHERE room_id = $1 AND user_id = $2",
      [id, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(404).json({ error: { message: "Room not found" } });
    }
    if (membership.rows[0].role !== "owner") {
      return res.status(403).json({ error: { message: "Only the owner can delete this room" } });
    }

    await pool.query("DELETE FROM rooms WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
