import Cart from "../model/cart.model";
import Order from "../model/order.model";

export const createOrder = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let totalAmount = 0;

    const orderItems = cart.items.map((item: any) => {
      const product = item.productId;

      const itemTotal = product.productPrice * item.quantity;
      totalAmount += itemTotal;

      return {
        productId: product._id,
        quantity: item.quantity,
        price: product.productPrice,
      };
    });

    const order = await Order.create({
      userId,
      items: orderItems,
      totalAmount,
      status: "pending",
    });

    // Clear cart after order
    cart.set("items", []);
    await cart.save();

    return res.status(201).json({
      success: true,
      order,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserOrders = async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    const orders = await Order.find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
