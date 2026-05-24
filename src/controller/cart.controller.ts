import Cart from "../model/cart.model";

export const addToCart = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    let cart = await Cart.findOne({ userId });

    // If no cart create one
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity }],
      });

      return res.json({ success: false, message: "Cart created", cart });
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
    return res.json({
      success: true,
      message: "Product added to cart sucessfully",
      cart,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET CART
export const getCart = async (req: any, res: any) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    return res.status(200).json({
      succes: true,
      cart,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// REMOVE FROMO CART
export const removeFromCart = async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.set(
      "items",
      cart.items.filter((item) => item.productId.toString() !== productId),
    );

    await cart.save();

    return res.json({ success: true, cart });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
