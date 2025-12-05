import mongoose from "mongoose";

const STATUS_VALUES = [
  "Food Preparing",
  "Looking for driver",
  "Driver assigned",
  "Out for delivery",
  "Delivered",
  "Redistribute",
  "Cancelled",
  "Donated",
];

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },

  driverId: { type: String, default: null },
  driverName: { type: String, default: null },
  driverAssignedAt: { type: Date },
  // what the user is currently paying for this order
  amount: { type: Number, required: true },

  // ⭐ base/original price when the order was first created
  originalAmount: { type: Number },

  address: { type: Object, required: true },

  // tracking who originally ordered vs who claimed
  originalUserId: { type: String },
  originalUserName: { type: String },
  claimedBy: { type: String },
  claimedByName: { type: String },
  claimedAt: { type: Date },

  // Updated with enum for stricter validation
  status: {
    type: String,
    enum: STATUS_VALUES,
    default: "Food Preparing",
  },

  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false },

  // rating / feedback fields
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  ratedAt: {
    type: Date,
  },
});

// 🔒 Safety net: ensure originalAmount is always set for new docs
orderSchema.pre("save", function (next) {
  if (this.isNew && typeof this.originalAmount !== "number") {
    this.originalAmount = this.amount;
  }
  next();
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
