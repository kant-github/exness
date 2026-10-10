import { Router } from "express";
import signinController from "../controllers/signinController";
import { getCandles } from "../controllers/getCandleController";
import getUserDataController from "../controllers/getUserDataController";
import authMiddleware from "../middleware/authMiddleware";
import placeTradeController from "../controllers/placeTradeController";
import getTradesController from "../controllers/getTradesController";

const router = Router();

router.post('/auth/signin', signinController);
router.get('/candles', getCandles);
router.get('/user', authMiddleware, getUserDataController);
router.post('/trade', authMiddleware, placeTradeController);
router.get('/trades', authMiddleware, getTradesController);

export default router;