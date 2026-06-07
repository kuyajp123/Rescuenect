import { PublicMobileAppController } from '@/controllers/public/MobileApp.Controller';
import express from 'express';

const router = express.Router();

router.get('/latest', PublicMobileAppController.getLatestRelease);
router.post('/eas-webhook', PublicMobileAppController.handleEasWebhook);

export default router;
