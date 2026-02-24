import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../utils/helpers';
import { guestNameRule } from '../utils/validators';

export const validate =
  (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      return next(new AppError(message, 400));
    }
    next();
  };

/**
 * Standalone middleware that validates a guest name from a specific request
 * location (body, query, or params). Defaults to req.body.name.
 *
 * Usage:
 *   router.get('/search', validateGuestName('query'), handler);
 *   router.post('/',      validateGuestName(),        handler);  // body
 */
export const validateGuestName =
  (source: 'body' | 'query' | 'params' = 'body', field = 'name') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const container = req[source] as Record<string, unknown>;
    const raw = container?.[field];

    // If the field is absent, let downstream required-checks handle it
    if (raw === undefined || raw === null) return next();

    const { error, value } = guestNameRule.validate(raw);
    if (error) {
      return next(
        new AppError(error.details.map((d) => d.message).join('; '), 400),
      );
    }

    // Write the trimmed/cleaned value back
    (container as Record<string, unknown>)[field] = value;
    next();
  };
