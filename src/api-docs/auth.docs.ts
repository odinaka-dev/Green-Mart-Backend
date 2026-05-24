import { Router } from "express";
import {
  loginUserController,
  registerUserController,
} from "../controller/auth.controller";
import { authLimiter } from "../middleware/rateLimit";
import { validate } from "../validators/auth.validate";
import { registerSchema } from "../modules/auth/auth.validation";

const router = Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: This endpoint logs in a user and returns a token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", authLimiter, loginUserController);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create new user
 *     description: This endpoint creates an account for a user and returns a token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phoneNumber
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               role:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account created successfully
 *       400:
 *         description: Invalid credentials
 */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerUserController,
);
