import { Router } from "express";
import signinController from "../controllers/signinController";
import { getCandles } from "../controllers/getCandleController";

const router = Router();

router.post('/auth/signin', signinController);
router.get('/candles', getCandles);

export default router;