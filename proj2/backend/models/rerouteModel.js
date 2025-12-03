import mongoose from "mongoose";

const RerouteSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },

    restaurantId: { type: mongoose.Schema.Types.ObjectId },
    restaurantName: { type: String },

    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shelter",
      required: true,
    },
    shelterName: { type: String },
    shelterAddress: { type: String },
    shelterContactEmail: { type: String },
    shelterContactPhone: { type: String },

    items: [
      {
        name: String,
        qty: Number,
        price: Number,
      },
    ],
    total: Number,

    // NEW: status used by portal
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },

    reason: String,
    by: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const rerouteModel = mongoose.model("reroutes", RerouteSchema);
export default rerouteModel;
