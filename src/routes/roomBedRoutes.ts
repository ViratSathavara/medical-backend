import { Router } from 'express';
import { RoomBedController } from '../controllers/roomBedController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createRoomSchema } from '../validators/index.js';
import { UserRole } from '../constants/roles.js';

const router = Router();

router.use(authenticate);

router.get('/rooms', RoomBedController.getRooms);
router.post('/rooms', authorize(UserRole.ADMIN), validate(createRoomSchema), RoomBedController.createRoom);
router.get('/beds', RoomBedController.getBeds);
router.patch('/beds/:id/status', authorize(UserRole.ADMIN, UserRole.STAFF), RoomBedController.updateBedStatus);

export default router;
