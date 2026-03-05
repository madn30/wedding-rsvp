import Joi from "joi";

export const adminLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(1).required().messages({
    "any.required": "Password is required",
  }),
});

export const guestNameRule = Joi.string()
  .trim()
  .min(2)
  .max(100)
  .pattern(/^[\p{L}\s'\-]+$/u)
  .required()
  .messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 100 characters",
    "string.pattern.base":
      "Name may only contain letters, spaces, hyphens, and apostrophes",
    "any.required": "Guest name is required",
  });

export const createGuestSchema = Joi.object({
  name: guestNameRule,
  phone: Joi.string()
    .pattern(/^(\+9725\d{8}|05\d{8})$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone must be a valid Israeli number (05XXXXXXXX or +9725XXXXXXXX)",
      "any.required": "Phone number is required",
    }),
});

export const rsvpResponseSchema = Joi.object({
  response: Joi.string().valid("yes", "no", "maybe").required().messages({
    "any.only": "Response must be yes, no, or maybe",
    "any.required": "Response is required",
  }),
  numberOfGuests: Joi.number().integer().min(0).max(20).optional(),
  foodPreference: Joi.string()
    .valid("regular", "vegetarian", "vegan", "gluten-free")
    .optional()
    .allow(null, ""),
  transportNeeded: Joi.boolean().optional(),
  specialRequests: Joi.string().max(500).optional().allow(null, ""),
});

export const sendMessageSchema = Joi.object({
  channel: Joi.string().valid("sms", "whatsapp").required().messages({
    "any.only": "Channel must be sms or whatsapp",
    "any.required": "Channel is required",
  }),
});
