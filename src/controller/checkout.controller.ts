import { Request, Response } from "express";
import { resolveGuest } from "../services/cart.service";
import { createGuestCheckout } from "../services/checkout.service";
import { checkoutSchema } from "../validators/checkout.validate";

/**
 * POST /api/checkout
 * Public guest checkout. Validates the cart & inventory, recalculates all
 * money server-side, creates the order + pending payment, and returns the
 * Flutterwave checkout link for the customer to complete payment.
 */
export const checkoutController = async (req: Request, res: Response) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Validation error",
        errors: parsed.error.issues,
      });
    }
    const body = parsed.data;

    // guestId may come from the header or the body.
    const guestId = (req.headers["x-guest-id"] as string) || body.guestId;
    const guest = await resolveGuest(guestId);

    const result = await createGuestCheckout({
      guest,
      customer: body.customer,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      couponCode: body.couponCode,
      deliveryMethod: body.deliveryMethod,
      shippingMethodId: body.shippingMethodId,
      currency: body.currency,
      paymentMethod: body.paymentMethod,
    });

    return res.status(201).json({
      success: true,
      message: "Checkout initialized. Redirect the customer to paymentLink.",
      data: {
        orderNumber: result.order.orderNumber,
        orderId: result.order._id,
        reference: result.txRef,
        amount: result.order.grandTotal,
        currency: result.order.currency,
        paymentLink: result.paymentLink,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Checkout failed",
    });
  }
};
