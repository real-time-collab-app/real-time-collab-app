import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required').max(100, 'Room name must be 100 characters or fewer'),
});

export const updateRoomSchema = z.object({
  name: z.string().trim().min(1, 'Room name is required').max(100, 'Room name must be 100 characters or fewer'),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;