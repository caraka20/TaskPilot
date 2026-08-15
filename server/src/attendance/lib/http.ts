import type { NextFunction, Request, RequestHandler, Response } from "express";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

type AsyncHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncRoute = (handler: AsyncHandler): RequestHandler =>
  (request, response, next) => {
    void handler(request, response, next).catch(next);
  };

export const routeParam = (request: Request, name: string) =>
  String(request.params[name]);
