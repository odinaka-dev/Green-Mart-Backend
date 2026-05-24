import { authLimiter } from "../middleware/rateLimit";
import { Router } from "express";
import {
  forgotPasswordController,
  loginUserController,
  registerUserController,
  resetPassword,
  verifyResetCode,
} from "../controller/auth.controller";
import { validate } from "../validators/auth.validate";
import { registerSchema } from "../modules/auth/auth.validation";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerUserController,
);
router.post("/login", authLimiter, loginUserController);
router.post("/forgot-password", authLimiter, forgotPasswordController); // NOT TESTED YET
router.post("/verify-otp", authLimiter, verifyResetCode); // NOT TESTED YET
router.post("/reset-password", authLimiter, resetPassword); // NOT TESTED YET

export default router;
