import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { AppError } from "../utils/helpers";
import { guestNameRule } from "../utils/validators";

export const validate =
  (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map((d) => d.message).join("; ");
      return next(new AppError(message, 400));
    }
    next();
  };

export const validateGuestName =
  (source: "body" | "query" | "params" = "body", field = "name") =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const container = req[source] as Record<string, unknown>;
    const raw = container?.[field];

    if (raw === undefined || raw === null) return next();

    const { error, value } = guestNameRule.validate(raw);
    if (error) {
      return next(
        new AppError(error.details.map((d) => d.message).join("; "), 400),
      );
    }

    (container as Record<string, unknown>)[field] = value;
    next();
  };
