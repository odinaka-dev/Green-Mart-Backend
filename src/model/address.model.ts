import mongoose from "mongoose";

/**
 * Reusable address shape. Exported both as a standalone collection (Address)
 * and as a sub-schema (addressSchema) embedded on the Order for guest orders,
 * so guest checkout never requires a persisted Address document.
 */
export const addressSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: "", trim: true },
    postalCode: { type: String, default: "", trim: true },
  },
  { _id: false },
);

// Standalone collection (optional persistence, e.g. for future saved addresses).
const addressDocumentSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: "" },
    postalCode: { type: String, default: "" },
  },
  { timestamps: true },
);

const Address = mongoose.model("Address", addressDocumentSchema);
export default Address;
