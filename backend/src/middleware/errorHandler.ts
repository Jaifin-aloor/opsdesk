import {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";

export function asyncHandler(
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(error);

  res.status(error.status || 500).json({
    error: error.message || "Internal server error",
  });
}