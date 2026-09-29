import { Router } from 'express';
import { DocumentController } from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('document'), DocumentController.uploadDocument);
router.get('/', DocumentController.getDocuments);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
