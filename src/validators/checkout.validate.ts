import { z } from "zod";

const addressSchema = z.object({
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  postalCode: z.string().optional(),
});

export const checkoutSchema = z.object({
  guestId: z.string().optional(), // also accepted via x-guest-id header

  customer: z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.email("A valid email is required"),
    phoneNumber: z.string().min(7, "A valid phone number is required"),
  }),

  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),

  couponCode: z.string().optional(),
  deliveryMethod: z.string().optional(),
  shippingMethodId: z.string().optional(),

  currency: z.string().optional(),
  paymentMethod: z.string().optional(),
  // paymentProvider is fixed to flutterwave server-side; accepted but ignored.
  paymentProvider: z.string().optional(),
});

export type CheckoutBody = z.infer<typeof checkoutSchema>;
