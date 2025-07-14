import { Router } from 'express';
import { handleCheckout, getQrPage, handleNotify } from '../controllers/finikController.js';

const router = Router();
// Checkout mode (Bitrix24 будет POST с BX_SYSTEM_PARAMS)
router.post('/finik/checkout', handleCheckout);
// Тестовый GET QR
router.get('/finik', getQrPage);
// Webhook Finik
router.post('/finik/notify', handleNotify);

export default router;