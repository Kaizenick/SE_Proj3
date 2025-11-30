import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  listOrders,
  placeOrder,
  updateStatus,
  userOrders,
  verifyOrder,
  placeOrderCod,
  cancelOrder,
  claimOrder,
  assignShelter,
  rateOrder, 
  driverAvailableOrders,
  driverMyOrders,      // 👈 add
  driverClaimOrder,    // 👈 add
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.get("/list", listOrders);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.post("/cancel_order", authMiddleware, cancelOrder);
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/status", updateStatus);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/placecod", authMiddleware, placeOrderCod);
orderRouter.post("/claim", authMiddleware, claimOrder);
orderRouter.post("/assign-shelter", assignShelter);

// NEW route – user rates a delivered order
orderRouter.post("/rate", authMiddleware, rateOrder);
orderRouter.get("/driver/available", driverAvailableOrders);
orderRouter.get("/driver/my", authMiddleware, driverMyOrders);
orderRouter.post("/driver/claim", authMiddleware, driverClaimOrder);

export default orderRouter;
