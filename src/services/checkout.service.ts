import mongoose from "mongoose";
import Coupon from "../model/coupon.model";
import ShippingMethod from "../model/shippingMethod.model";
import Order from "../model/order.model";
import Payment from "../model/payment.model";
import OrderTimeline from "../model/orderTimeline.model";
import PaymentEvent from "../model/paymentEvent.model";
import { paymentConfig } from "../config/payment";
import { generateOrderNumber, generateTxRef } from "../utils/reference";
import { AppError } from "../utils/apiResponse";
import { validateCartForCheckout, CartSummary } from "./cart.service";
import { FlutterwavePaymentService } from "./payment/flutterwave.service";

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Validate a coupon against the cart subtotal and return the discount amount.
 * Returns { discount: 0 } silently when no code is supplied; throws on an
 * invalid/expired/ineligible code.
 */
export const applyCoupon = async (
  code: string | undefined | null,
  subtotal: number,
): Promise<{ discount: number; coupon: any }> => {
  if (!code) return { discount: 0, coupon: null };

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon || !coupon.isActive) {
    throw new AppError("Invalid coupon code", 400);
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new AppError("This coupon has expired", 400);
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("This coupon has reached its usage limit", 400);
  }
  if (subtotal < coupon.minSubtotal) {
    throw new AppError(
      `A minimum subtotal of ${coupon.minSubtotal} is required for this coupon`,
      400,
    );
  }

  let discount =
    coupon.type === "percentage" ? (subtotal * coupon.value) / 100 : coupon.value;

  if (coupon.type === "percentage" && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal); // never discount below zero

  return { discount: round(discount), coupon };
};

/**
 * Resolve the selected shipping method and return its server-side fee.
 */
export const resolveShipping = async (
  shippingMethodId?: string | null,
): Promise<{ id: any; name: string | null; fee: number }> => {
  if (!shippingMethodId) return { id: null, name: null, fee: 0 };

  if (!mongoose.Types.ObjectId.isValid(shippingMethodId)) {
    throw new AppError("Invalid shipping method", 400);
  }
  const method = await ShippingMethod.findOne({
    _id: shippingMethodId,
    isActive: { $ne: false },
  });
  if (!method) {
    throw new AppError("Selected shipping method is not available", 400);
  }
  return { id: method._id, name: method.name, fee: method.fee };
};

export interface CheckoutInput {
  guest: any;
  customer: { fullName: string; email: string; phoneNumber: string };
  shippingAddress: any;
  billingAddress?: any;
  couponCode?: string;
  deliveryMethod?: string;
  shippingMethodId?: string;
  currency?: string;
  paymentMethod?: string;
}

/**
 * The core guest checkout pipeline:
 *   validate cart → validate inventory → recalculate prices → apply coupon &
 *   shipping & tax → create Order (pending) → create Payment (pending) →
 *   initialize Flutterwave → return the checkout link.
 *
 * No inventory is deducted here — that happens only after verified payment.
 */
export const createGuestCheckout = async (input: CheckoutInput) => {
  const currency = input.currency || paymentConfig.defaultCurrency;

  // 1 & 2. Validate cart + inventory (throws on empty / inactive / out-of-stock).
  const summary: CartSummary = await validateCartForCheckout(input.guest);

  // 3. Recalculate money server-side — client values are ignored entirely.
  const subtotal = round(summary.subtotal);
  const { discount, coupon } = await applyCoupon(input.couponCode, subtotal);
  const shipping = await resolveShipping(input.shippingMethodId);
  const taxable = Math.max(subtotal - discount, 0);
  const taxTotal = round(taxable * paymentConfig.taxRate);
  const grandTotal = round(taxable + shipping.fee + taxTotal);

  if (grandTotal <= 0) {
    throw new AppError("Order total must be greater than zero", 400);
  }

  // 4. Persist the order BEFORE payment so abandoned/failed attempts are tracked.
  const orderNumber = generateOrderNumber();
  const txRef = generateTxRef();

  const order = await Order.create({
    orderNumber,
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    billingAddress: input.billingAddress || null,
    items: summary.items.map((i) => ({
      product: i.productId,
      variant: i.variantId,
      productName: i.productName,
      image: i.image,
      attributes: i.attributes,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    subtotal,
    discountTotal: discount,
    shippingFee: shipping.fee,
    taxTotal,
    grandTotal,
    currency,
    couponCode: coupon ? coupon.code : null,
    deliveryMethod: input.deliveryMethod || null,
    shippingMethod: { id: shipping.id, name: shipping.name, fee: shipping.fee },
    orderStatus: "pending",
    paymentStatus: "pending",
    paymentReference: txRef,
    paymentProvider: "flutterwave",
    metadata: { guestId: input.guest.guestId, paymentMethod: input.paymentMethod || null },
  });

  await OrderTimeline.create({
    order: order._id,
    status: "pending",
    title: "Order created",
    description: `Order ${orderNumber} created and awaiting payment.`,
  });

  // 5. Create the pending payment record.
  const payment = await Payment.create({
    order: order._id,
    txRef,
    provider: "flutterwave",
    amount: grandTotal,
    currency,
    customerEmail: input.customer.email,
    paymentMethod: input.paymentMethod || null,
    status: "pending",
  });

  await PaymentEvent.create({
    order: order._id,
    payment: payment._id,
    txRef,
    type: "payment.initialized",
    status: "pending",
    source: "system",
  });

  // 6. Initialize Flutterwave and get the hosted checkout link.
  const init = await FlutterwavePaymentService.initializePayment({
    txRef,
    amount: grandTotal,
    currency,
    customer: {
      email: input.customer.email,
      name: input.customer.fullName,
      phonenumber: input.customer.phoneNumber,
    },
    meta: { orderId: order._id.toString(), orderNumber },
  });

  return {
    order,
    payment,
    paymentLink: init.link,
    txRef,
  };
};
