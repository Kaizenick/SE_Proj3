import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    contactName: { type: String, default: "" },
    contactPhone: { type: String, default: "" },

    // Use this as the login email
    contactEmail: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    capacity: { type: Number, default: 0 },
    address: {
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: { type: String, default: "United States" },
    },
    active: { type: Boolean, default: true },
  },
  { versionKey: false, timestamps: true }
);

// HASH PASSWORD BEFORE SAVE
shelterSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// COMPARE PASSWORD
shelterSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

const shelterModel =
  mongoose.models.shelter || mongoose.model("shelter", shelterSchema);

export default shelterModel;
