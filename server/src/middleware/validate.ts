import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject } from 'zod';

/**
 * Express middleware for validating request body against a Zod schema
 */
export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
