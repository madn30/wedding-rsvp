import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  seatGuest,
  unseatGuest,
} from '../controllers/tableController';

const router = Router();

// All table routes require a valid admin JWT
router.use(protect);

router.get('/', getTables);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);

// Seating assignment sub-resources
router.post('/:id/seat/:guestId', seatGuest);
router.delete('/:id/seat/:guestId', unseatGuest);

export default router;
