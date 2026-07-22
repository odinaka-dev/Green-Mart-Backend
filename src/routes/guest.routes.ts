import { Router } from "express";
import { createGuestSession } from "../controller/guest.controller";

const router = Router();

/**
 * @swagger
 * /api/guest/session:
 *   post:
 *     summary: Create a guest session
 *     description: |
 *       Creates a new anonymous guest session and returns a short-lived JWT.
 *       The frontend should store this token and include it in the Authorization
 *       header (Bearer) for cart and favorites requests.
 *       When the guest later registers or logs in, pass the token as `guestToken`
 *       in the request body — the backend will merge their data automatically.
 *     tags:
 *       - Guest
 *     responses:
 *       201:
 *         description: Guest session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 guestToken:
 *                   type: string
 *                 guestId:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
router.post("/session", createGuestSession);

export default router;
