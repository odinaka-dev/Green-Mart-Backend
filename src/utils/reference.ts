import crypto from "crypto";

/**
 * Generate a human-readable, unique order number, e.g. "GM-20260721-4F9A2C".
 */
export const generateOrderNumber = (): string => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `GM-${y}${m}${d}-${rand}`;
};

/**
 * Generate a unique transaction reference used as Flutterwave `tx_ref`.
 * e.g. "GM-TX-1737460000000-9F3B21C4".
 */
export const generateTxRef = (): string => {
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `GM-TX-${Date.now()}-${rand}`;
};
