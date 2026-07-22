import Cart from "../model/cart.model";
import Guest from "../model/guest.model";

// ─── helpers ─────────────────────────────────────────────────────────────────

const isGuest = (user: any) => user?.type === "guest";

/**
 * Resolve the Guest document from req.user.id.
 * Returns null (with a 404 response already sent) when the session has expired.
 */
const resolveGuest = async (user: any, res: any) => {
  const guest = await Guest.findById(user.id);
  if (!guest) {
    res.status(404).json({
      success: false,
      message: "Guest session not found or has expired. Please create a new session.",
    });
    return null;
  }
  return guest;
};

// ─── Add to cart ─────────────────────────────────────────────────────────────

export const addToCart = async (req: any, res: any) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    // ── Guest path ────────────────────────────────────────────────────────────
    if (isGuest(req.user)) {
      const guest = await resolveGuest(req.user, res);
      if (!guest) return;

      const itemIndex = guest.cart.findIndex(
        (item: any) => item.productId.toString() === productId,
      );

      if (itemIndex > -1) {
        guest.cart[itemIndex].quantity += quantity;
      } else {
        guest.cart.push({ productId, quantity });
      }

      await guest.save();

      return res.status(200).json({
        success: true,
        message: "Product added to cart",
        cart: guest.cart,
      });
    }

    // ── Authenticated user path ───────────────────────────────────────────────
    const userId = req.user.userId;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [{ productId, quantity }] });
      return res.status(201).json({ success: true, message: "Cart created", cart });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Get cart ─────────────────────────────────────────────────────────────────

export const getCart = async (req: any, res: any) => {
  try {
    // ── Guest path ────────────────────────────────────────────────────────────
    if (isGuest(req.user)) {
      const guest = await resolveGuest(req.user, res);
      if (!guest) return;

      // Populate productId manually for consistency with user cart response
      await guest.populate("cart.productId");

      return res.status(200).json({ success: true, cart: guest.cart });
    }

    // ── Authenticated user path ───────────────────────────────────────────────
    const userId = req.user.userId;
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    return res.status(200).json({ success: true, cart });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Remove from cart ─────────────────────────────────────────────────────────

export const removeFromCart = async (req: any, res: any) => {
  try {
    const { productId } = req.params;

    // ── Guest path ────────────────────────────────────────────────────────────
    if (isGuest(req.user)) {
      const guest = await resolveGuest(req.user, res);
      if (!guest) return;

      guest.set(
        "cart",
        guest.cart.filter((item: any) => item.productId.toString() !== productId),
      );

      await guest.save();

      return res.status(200).json({ success: true, cart: guest.cart });
    }

    // ── Authenticated user path ───────────────────────────────────────────────
    const userId = req.user.userId;
    const cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    cart.set(
      "items",
      cart.items.filter((item) => item.productId.toString() !== productId),
    );

    await cart.save();

    return res.status(200).json({ success: true, cart });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Clear cart ───────────────────────────────────────────────────────────────

export const clearCart = async (req: any, res: any) => {
  try {
    // ── Guest path ────────────────────────────────────────────────────────────
    if (isGuest(req.user)) {
      const guest = await resolveGuest(req.user, res);
      if (!guest) return;

      guest.set("cart", []);
      await guest.save();

      return res.status(200).json({ success: true, message: "Cart cleared" });
    }

    // ── Authenticated user path ───────────────────────────────────────────────
    const userId = req.user.userId;
    await Cart.findOneAndDelete({ userId });

    return res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
