import { Router } from "express";
import signinController from "../controllers/signinController";
import { getCandles } from "../controllers/getCandleController";
import getUserDataController from "../controllers/getUserDataController";
import authMiddleware from "../middleware/authMiddleware";
import placeTradeController from "../controllers/placeTradeController";
import closeTradeController from "../controllers/closeTradeController";
import getPositionsController from "../controllers/getPositionsController";

const router = Router();

router.post('/auth/signin', signinController);
router.get('/candles', getCandles);
router.get('/user', authMiddleware, getUserDataController);
router.post('/trade', authMiddleware, placeTradeController);
router.post('/trade/:id/close', authMiddleware, closeTradeController);
router.get('/positions', authMiddleware, getPositionsController);

export default router;