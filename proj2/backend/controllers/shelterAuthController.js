import shelterModel from "../models/shelterModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const shelterLogin = async (req, res) => {
  const { email, password } = req.body;

  const shelter = await shelterModel.findOne({ contactEmail: email });
  if (!shelter) {
    return res
      .status(400)
      .json({ success: false, message: "Shelter not found" });
  }

  const isMatch = await bcrypt.compare(password, shelter.password);
  if (!isMatch) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid password" });
  }

  const token = jwt.sign(
    { id: shelter._id, email: shelter.contactEmail },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  );

  return res.json({
    success: true,
    message: "Login successful",
    token,
    shelter,
  });
};
