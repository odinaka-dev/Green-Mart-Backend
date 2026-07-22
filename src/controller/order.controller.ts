import { Request, Response } from "express";
import mongoose from "mongoose";
import Order, { ORDER_STATUS } from "../model/order.model";
import OrderTimeline from "../model/orderTimeline.model";

/**
 * GET /api/order/track/:orderNumber?email=...
 * Public order lookup for guests. Requires the customer email to match the
 * order, so order numbers alone cannot enumerate other people's orders.
 */
export const trackOrderController = async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const email = (req.query.email as string) || "";

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required to track an order" });
    }

    const order = await Order.findOne({
      orderNumber,
      "customer.email": email.toLowerCase().trim(),
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const timeline = await OrderTimeline.find({ order: order._id }).sort({
      createdAt: 1,
    });

    return res.status(200).json({ success: true, data: { order, timeline } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: list orders ───────────────────────────────────────────────────────
export const listOrdersController = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.orderStatus) filter.orderStatus = req.query.orderStatus;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.email) {
      filter["customer.email"] = (req.query.email as string).toLowerCase().trim();
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: { page, limit, total, totalPages: Math.ceil(total / limit), data: orders },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: get single order with timeline ────────────────────────────────────
export const getOrderController = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const order = await Order.findById(orderId).populate("items.product", "productName");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const timeline = await OrderTimeline.find({ order: order._id }).sort({
      createdAt: 1,
    });

    return res.status(200).json({ success: true, data: { order, timeline } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Admin: update fulfilment status ──────────────────────────────────────────
export const updateOrderStatusController = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId as string;
    const { orderStatus } = req.body;

    if (!ORDER_STATUS.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `orderStatus must be one of: ${ORDER_STATUS.join(", ")}`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.set("orderStatus", orderStatus);
    await order.save();

    await OrderTimeline.create({
      order: order._id,
      status: orderStatus,
      title: `Order marked ${orderStatus}`,
      description: `Status updated by admin to "${orderStatus}".`,
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      data: order,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
