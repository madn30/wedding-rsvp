import { Router } from "express";
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  seatGuest,
  unseatGuest,
} from "../controllers/tableController";

const router = Router();

router.get("/", getTables);
router.post("/", createTable);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);

router.post("/:id/seat/:guestId", seatGuest);
router.delete("/:id/seat/:guestId", unseatGuest);

export default router;
