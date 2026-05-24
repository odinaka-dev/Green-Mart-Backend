import { authLimiter } from "../middleware/rateLimit";
import { Router } from "express";
import {
  loginUserController,
  registerUserController,
} from "../controller/auth.controller";
import { validate } from "../validators/auth.validate";
import { registerSchema } from "../modules/auth/auth.validation";

const router = Router();

router.post("/login", authLimiter, loginUserController);
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerUserController,
);

export default router;
