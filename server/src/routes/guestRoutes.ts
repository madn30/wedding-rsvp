import { Router } from "express";
import {
  getGuests,
  createGuest,
  deleteGuest,
  sendInvitation,
  exportCSV,
} from "../controllers/guestController";
import { protect } from "../middlewares/auth";
import { validate, validateGuestName } from "../middlewares/validate";
import { createGuestSchema, sendMessageSchema } from "../utils/validators";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(validateGuestName("query", "search"), getGuests)
  .post(validateGuestName(), validate(createGuestSchema), createGuest);
router.get("/export", exportCSV);
router.delete("/:id", deleteGuest);
router.post("/:id/send", validate(sendMessageSchema), sendInvitation);

export default router;
