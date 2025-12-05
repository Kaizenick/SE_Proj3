import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";
import shelterModel from "../../models/shelterModel.js";
import rerouteModel from "../../models/rerouteModel.js";

// Important: set dummy Stripe key BEFORE importing the controller file
process.env.STRIPE_SECRET_KEY = "sk_test_dummy_123";

// Will be filled after dynamic import
let placeOrder,
  listOrders,
  userOrders,
  updateStatus,
  verifyOrder,
  placeOrderCod,
  cancelOrder,
  assignShelter,
  claimOrder,
  rateOrder,
  driverAvailableOrders,
  driverMyOrders,
  driverClaimOrder,
  driverMarkDelivered;

let mongod;

// ---- helpers ----
const createMockRes = () => {
  const res = {};
  res.body = null;
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const createMockReq = (body = {}, appMap = {}) => {
  return {
    body,
    app: {
      get: (key) => appMap[key] ?? null,
    },
  };
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri("food_delivery_test");
  await mongoose.connect(uri, { dbName: "food_delivery_test" });

  const controllerModule = await import("../../controllers/orderController.js");
  ({
    placeOrder,
    listOrders,
    userOrders,
    updateStatus,
    verifyOrder,
    placeOrderCod,
    cancelOrder,
    assignShelter,
    claimOrder,
    rateOrder,
    driverAvailableOrders,
    driverMyOrders,
    driverClaimOrder,
    driverMarkDelivered,
  } = controllerModule);
});

afterEach(async () => {
  await Promise.all([
    orderModel.deleteMany({}),
    userModel.deleteMany({}),
    shelterModel.deleteMany({}),
    rerouteModel.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

// ----------------------------
// placeOrder & placeOrderCod
// ----------------------------
describe("Order placement controllers", () => {
  it("placeOrder should create order and return verify URL", async () => {
    const user = await userModel.create({
      name: "User A",
      email: "a@example.com",
      password: "pass",
      cartData: { 1: 2 },
    });

    const req = createMockReq({
      userId: user._id.toString(),
      items: [{ name: "Pizza", price: 15, quantity: 1 }],
      amount: 15,
      address: {
        firstName: "User",
        lastName: "A",
        formatted: "123 Main St",
      },
    });

    const res = createMockRes();
    await placeOrder(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.session_url).toContain("/verify?success=true&orderId=");
    const orders = await orderModel.find({});
    expect(orders).toHaveLength(1);
    expect(orders[0].amount).toBe(15);
    expect(orders[0].originalAmount).toBe(15);
    expect(orders[0].userId.toString()).toBe(user._id.toString());

    const updatedUser = await userModel.findById(user._id);
    expect(updatedUser.cartData).toEqual({});
  });

  it("placeOrderCod should create order with payment=true and clear cart", async () => {
    const user = await userModel.create({
      name: "User B",
      email: "b@example.com",
      password: "pass",
      cartData: { 2: 3 },
    });

    const req = createMockReq({
      userId: user._id.toString(),
      items: [{ name: "Burger", price: 10, quantity: 1 }],
      amount: 10,
      address: {
        name: "User B",
        formatted: "456 Elm St",
      },
    });

    const res = createMockRes();
    await placeOrderCod(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Order Placed");

    const orders = await orderModel.find({});
    expect(orders).toHaveLength(1);
    expect(orders[0].payment).toBe(true);

    const updatedUser = await userModel.findById(user._id);
    expect(updatedUser.cartData).toEqual({});
  });
});

// ----------------------------
// listOrders & userOrders
// ----------------------------
describe("Order listing controllers", () => {
  it("listOrders should return all orders", async () => {
    await orderModel.create([
      {
        userId: "u1",
        items: [],
        amount: 10,
        address: { formatted: "A" },
      },
      {
        userId: "u2",
        items: [],
        amount: 20,
        address: { formatted: "B" },
      },
    ]);

    const req = createMockReq({});
    const res = createMockRes();
    await listOrders(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it("userOrders should return orders for user & claimedBy", async () => {
    await orderModel.create([
      {
        userId: "user-1",
        items: [],
        amount: 10,
        address: { formatted: "A" },
      },
      {
        userId: "user-2",
        claimedBy: "user-1",
        items: [],
        amount: 15,
        address: { formatted: "B" },
      },
      {
        userId: "other",
        items: [],
        amount: 99,
        address: { formatted: "C" },
      },
    ]);

    const req = createMockReq({ userId: "user-1" });
    const res = createMockRes();
    await userOrders(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    const ids = res.body.data.map((o) => o.userId || o.claimedBy);
    expect(ids).toContain("user-1");
  });
});

// ----------------------------
// updateStatus & verifyOrder
// ----------------------------
describe("Order status & verification", () => {
  it("updateStatus should allow legal status transition", async () => {
    const order = await orderModel.create({
      userId: "u1",
      items: [],
      amount: 10,
      address: { formatted: "A" },
      status: "Food Preparing",
    });

    const req = createMockReq({
      orderId: order._id.toString(),
      status: "Looking for DRIVER", // different casing/spacing
    });
    const res = createMockRes();

    await updateStatus(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("Looking for driver");

    const updated = await orderModel.findById(order._id);
    expect(updated.status).toBe("Looking for driver");
  });

  it("updateStatus should reject illegal transitions", async () => {
    const order = await orderModel.create({
      userId: "u1",
      items: [],
      amount: 10,
      address: { formatted: "A" },
      status: "Delivered",
    });

    const req = createMockReq({
      orderId: order._id.toString(),
      status: "Food Preparing",
    });
    const res = createMockRes();

    await updateStatus(req, res);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Illegal transition/);
  });

  it("verifyOrder: success=true should mark payment true", async () => {
    const order = await orderModel.create({
      userId: "u1",
      items: [],
      amount: 10,
      address: { formatted: "A" },
      payment: false,
    });

    const req = createMockReq({
      orderId: order._id.toString(),
      success: "true",
    });
    const res = createMockRes();

    await verifyOrder(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Paid");

    const updated = await orderModel.findById(order._id);
    expect(updated.payment).toBe(true);
  });

  it("verifyOrder: success!=true should delete order", async () => {
    const order = await orderModel.create({
      userId: "u1",
      items: [],
      amount: 10,
      address: { formatted: "A" },
    });

    const req = createMockReq({
      orderId: order._id.toString(),
      success: "false",
    });
    const res = createMockRes();

    await verifyOrder(req, res);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Not Paid");

    const deleted = await orderModel.findById(order._id);
    expect(deleted).toBeNull();
  });
});

// ----------------------------
// cancelOrder & claimOrder
// ----------------------------
describe("Order cancellation & claiming", () => {
  it("cancelOrder should move order to Redistribute and queue notification", async () => {
    const order = await orderModel.create({
      userId: "user-1",
      items: [{ name: "Veg Rice", price: 10, quantity: 1, isVeg: true }],
      amount: 10,
      address: { formatted: "A" },
      status: "Food Preparing",
    });

    const queueNotification = jest.fn();
    const req = createMockReq(
      { orderId: order._id.toString(), userId: "user-1" },
      { queueNotification }
    );
    const res = createMockRes();

    await cancelOrder(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/cancelled successfully/i);

    const updated = await orderModel.findById(order._id);
    expect(updated.status).toBe("Redistribute");

    expect(queueNotification).toHaveBeenCalledTimes(1);
    const arg = queueNotification.mock.calls[0][0];
    expect(arg.orderId).toBe(order._id.toString());
    expect(arg.foodCategory).toBe("veg");
  });

  it("cancelOrder should reject unauthorized user", async () => {
    const order = await orderModel.create({
      userId: "user-1",
      items: [],
      amount: 10,
      address: { formatted: "A" },
      status: "Food Preparing",
    });

    const req = createMockReq({
      orderId: order._id.toString(),
      userId: "other",
    });
    const res = createMockRes();

    await cancelOrder(req, res);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("claimOrder should apply discount, transfer ownership, and reset status", async () => {
    const originalUser = await userModel.create({
      name: "Original",
      email: "orig@example.com",
      password: "x",
    });
    const claimer = await userModel.create({
      name: "Claimer",
      email: "claimer@example.com",
      password: "x",
    });

    const order = await orderModel.create({
      userId: originalUser._id.toString(),
      items: [{ name: "Food", price: 15, quantity: 1 }],
      amount: 1500,
      address: { formatted: "A", name: "Original Name" },
      status: "Redistribute",
    });

    const req = createMockReq({
      orderId: order._id.toString(),
      userId: claimer._id.toString(),
    });
    const res = createMockRes();

    await claimOrder(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/claimed successfully/i);

    const updated = await orderModel.findById(order._id);
    // originalAmount preserved
    expect(updated.originalAmount).toBe(1500);
    // discounted: 2/3 of original, rounded
    expect(updated.amount).toBe(Math.round(1500 * (2 / 3)));
    expect(updated.userId.toString()).toBe(claimer._id.toString());
    expect(updated.claimedBy.toString()).toBe(claimer._id.toString());
    expect(updated.status).toBe("Food Preparing");
  });
});

// ----------------------------
// assignShelter
// ----------------------------
describe("assignShelter (donation flow)", () => {
  it("should mark order as donated and create reroute record", async () => {
    const shelter = await shelterModel.create({
      name: "Helping Hands",
      password: "shelter-pass", // ✅ required by schema
      contactEmail: "help@example.com",
      contactPhone: "123",
      address: {
        street: "1 Aid St",
        city: "Raleigh",
        state: "NC",
        zipcode: "27601",
        country: "United States",
      },
    });

    const order = await orderModel.create({
      userId: "u1",
      items: [{ name: "Sandwich", price: 5, quantity: 2 }],
      amount: 10,
      address: { formatted: "User Addr" },
      status: "Redistribute",
      restaurantId: "rest-1",
      restaurantName: "Good Food",
    });

    const req = createMockReq({
      orderId: order._id.toString(),
      shelterId: shelter._id.toString(),
    });
    const res = createMockRes();

    await assignShelter(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/marked as donated/i);

    const updatedOrder = await orderModel.findById(order._id);
    expect(updatedOrder.status).toBe("Donated");

    const reroutes = await rerouteModel.find({});
    expect(reroutes).toHaveLength(1);
    expect(reroutes[0].shelterName).toBe("Helping Hands");
    expect(reroutes[0].status).toBe("pending");
  });
});

// ----------------------------
// rateOrder
// ----------------------------
describe("rateOrder", () => {
  it("should let owner rate a delivered order", async () => {
    const user = await userModel.create({
      name: "Rater",
      email: "rate@example.com",
      password: "x",
    });

    const order = await orderModel.create({
      userId: user._id.toString(),
      items: [],
      amount: 10,
      address: { formatted: "Addr" },
      status: "Delivered",
    });

    const req = createMockReq({
      userId: user._id.toString(),
      orderId: order._id.toString(),
      rating: 5,
      feedback: "Great food!",
    });
    const res = createMockRes();

    await rateOrder(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/thank you/i);

    const updated = await orderModel.findById(order._id);
    expect(updated.rating).toBe(5);
    expect(updated.feedback).toBe("Great food!");
    expect(updated.ratedAt).toBeInstanceOf(Date);
  });

  it("should reject rating from non-owner", async () => {
    const owner = await userModel.create({
      name: "Owner",
      email: "o@example.com",
      password: "x",
    });
    const other = await userModel.create({
      name: "Other",
      email: "p@example.com",
      password: "x",
    });

    const order = await orderModel.create({
      userId: owner._id.toString(),
      items: [],
      amount: 10,
      address: { formatted: "Addr" },
      status: "Delivered",
    });

    const req = createMockReq({
      userId: other._id.toString(),
      orderId: order._id.toString(),
      rating: 4,
    });
    const res = createMockRes();

    await rateOrder(req, res);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only rate your own orders/i);
  });
});

// ----------------------------
// Driver flows
// ----------------------------
describe("Driver order flows", () => {
  it("driverAvailableOrders should return orders with Looking for driver", async () => {
    const driver = await userModel.create({
      name: "Driver",
      email: "d@example.com",
      password: "x",
      isDriver: true,
    });

    await orderModel.create([
      {
        userId: "u1",
        items: [],
        amount: 10,
        address: { formatted: "A" },
        status: "Looking for driver",
      },
      {
        userId: "u2",
        items: [],
        amount: 20,
        address: { formatted: "B" },
        status: "Food Preparing",
      },
    ]);

    const req = createMockReq({ userId: driver._id.toString() });
    const res = createMockRes();

    await driverAvailableOrders(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe("Looking for driver");
  });

  it("driverAvailableOrders should reject non-driver", async () => {
    const user = await userModel.create({
      name: "User",
      email: "u@example.com",
      password: "x",
      isDriver: false,
    });

    const req = createMockReq({ userId: user._id.toString() });
    const res = createMockRes();

    await driverAvailableOrders(req, res);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only drivers/i);
  });

  it("driverMyOrders should list orders for driver", async () => {
    const driver = await userModel.create({
      name: "Driver",
      email: "d2@example.com",
      password: "x",
      isDriver: true,
    });

    await orderModel.create([
      {
        userId: "u1",
        driverId: driver._id,
        items: [],
        amount: 10,
        address: { formatted: "A" },
      },
      {
        userId: "u2",
        driverId: new mongoose.Types.ObjectId(),
        items: [],
        amount: 20,
        address: { formatted: "B" },
      },
    ]);

    const req = createMockReq({ userId: driver._id.toString() });
    const res = createMockRes();

    await driverMyOrders(req, res);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it("driverClaimOrder should claim order and move to Driver assigned", async () => {
    const driver = await userModel.create({
      name: "Driver C",
      email: "dc@example.com",
      password: "x",
      isDriver: true,
    });

    const order = await orderModel.create({
      userId: "u1",
      items: [],
      amount: 10,
      address: { formatted: "A" },
      status: "Looking for driver",
    });

    const mockIo = { emit: jest.fn() };
    const req = createMockReq(
      {
        userId: driver._id.toString(),
        orderId: order._id.toString(),
      },
      { socketio: mockIo }
    );
    const res = createMockRes();

    await driverClaimOrder(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("Driver assigned");
    expect(res.body.data.driverId.toString()).toBe(driver._id.toString());

    expect(mockIo.emit).toHaveBeenCalledWith(
      "driver-order-claimed",
      expect.objectContaining({
        orderId: order._id.toString(),
        driverId: driver._id.toString(),
      })
    );
  });

  it("driverMarkDelivered should set status to Delivered", async () => {
    const driver = await userModel.create({
      name: "Driver D",
      email: "dd@example.com",
      password: "x",
      isDriver: true,
    });

    const order = await orderModel.create({
      userId: "u1",
      items: [],
      amount: 10,
      address: { formatted: "A" },
      status: "Out for delivery",
      driverId: driver._id,
    });

    const mockIo = { emit: jest.fn() };
    const req = createMockReq(
      {
        userId: driver._id.toString(),
        orderId: order._id.toString(),
      },
      { socketio: mockIo }
    );
    const res = createMockRes();

    await driverMarkDelivered(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("Delivered");

    const updated = await orderModel.findById(order._id);
    expect(updated.status).toBe("Delivered");

    // deliveredAt may not be in the schema, but it IS set on the response object
    expect(res.body.data.deliveredAt).toBeDefined();

    expect(mockIo.emit).toHaveBeenCalledWith(
      "driver-order-delivered",
      expect.objectContaining({
        orderId: order._id.toString(),
        driverId: driver._id.toString(),
      })
    );
  });
});
