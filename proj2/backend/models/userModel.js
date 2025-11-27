import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  cartData: { type: Object, default: {} },

  address: {
    formatted: { type: String }, // full human-readable address
    lat: { type: Number },       // latitude
    lng: { type: Number },       // longitude
  },

  // 🔹 Veg preference: "any" or "veg-only"
  dietPreference: {
    type: String,
    enum: ["any", "veg-only"],
    default: "any",
  },

  // 🔹 Sugar/sweets preference: "any" or "no-sweets"
  sugarPreference: {
    type: String,
    enum: ["any", "no-sweets"],
    default: "any",
  },
  isAdmin: {
      type: Boolean,
      default: false,
    },

    //  driver flag (NEW)
    isDriver: {
      type: Boolean,
      default: false,
    },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
