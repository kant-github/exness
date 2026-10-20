import { Router } from "express";
import signinController from "../controllers/signinController";
import { getCandles } from "../controllers/getCandleController";
import getUserDataController from "../controllers/getUserDataController";
import authMiddleware from "../middleware/authMiddleware";
import placeTradeController from "../controllers/placeTradeController";
import {
    getOrdersController,
    updateOrderController,
    cancelOrderController,
    closeOrderController,
} from "../controllers/ordersController";

const router = Router();

router.post('/auth/signin', signinController);
router.get('/candles', getCandles);
router.get('/user', authMiddleware, getUserDataController);
router.post('/trade', authMiddleware, placeTradeController);
router.get('/orders', authMiddleware, getOrdersController);
router.patch('/orders/:id', authMiddleware, updateOrderController);
router.post('/orders/:id/cancel', authMiddleware, cancelOrderController);
router.post('/orders/:id/close', authMiddleware, closeOrderController);

export default router;
