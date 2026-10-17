import { Router } from "express";
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  setActiveEvent,
  clearActiveEvent,
} from "../controllers/eventController";

const router = Router();

router.get("/", getEvents);
router.post("/", createEvent);
router.post("/clear-active", clearActiveEvent);
router.put("/:id", updateEvent);
router.post("/:id/set-active", setActiveEvent);
router.delete("/:id", deleteEvent);

export default router;
