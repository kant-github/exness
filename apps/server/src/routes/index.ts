import { Router } from "express";
import signinController from "../controllers/signinController";
import { getCandles } from "../controllers/getCandleController";
import getUserDataController from "../controllers/getUserDataController";
import authMiddleware from "../middleware/authMiddleware";
import placeTradeController from "../controllers/placeTradeController";
import topUpController from "../controllers/topUpController";

const router = Router();

router.post('/auth/signin', signinController);
router.get('/candles', getCandles);
router.get('/user', authMiddleware, getUserDataController);
router.post('/trade', authMiddleware, placeTradeController);
router.post('/balance/topup', authMiddleware, topUpController);

export default router;