/**
 * twilioService.ts  — DEPRECATED / SHIM
 * ──────────────────────────────────────────────────────────────────────────────
 * Twilio has been removed from this project.  All logic now lives in
 * messagingService.ts which uses whatsapp-web.js.
 *
 * This file re-exports the old names so any remaining imports keep compiling
 * while they are being migrated.  Remove this file once guestController.ts
 * has been updated to import from messagingService directly.
 */

export {
  sendInvite as sendSMS,
  normalizeIsraeliPhone,
  MessageChannel,
} from './messagingService';
