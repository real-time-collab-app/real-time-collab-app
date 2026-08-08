import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Generic request-body validation middleware.
 * Pass any zod schema, and this returns an Express middleware
 * that validates req.body against it before the route handler runs.
 *
 * Reusable across auth (RTC-22), rooms CRUD (RTC-24), and beyond.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          message: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
      });
    }

    req.body = result.data;
    next();
  };
}