import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  console.error(err.stack);

  res.status(500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
}