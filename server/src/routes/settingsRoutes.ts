import { Router } from "express";
import {
  getSettings,
  updateTemplates,
  setRsvpLock,
  triggerReminder30,
  triggerDayOf,
} from "../controllers/settingsController";

const router = Router();

router.get("/", getSettings);

router.put("/templates", updateTemplates);

router.post("/lock", setRsvpLock);

router.post("/trigger/reminder30", triggerReminder30);

router.post("/trigger/dayof", triggerDayOf);

export default router;
