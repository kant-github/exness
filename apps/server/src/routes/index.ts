import { Router } from "express";
import signinController from "../controllers/signinController";

const router = Router();

router.post('/auth/signin', signinController);

export default router;