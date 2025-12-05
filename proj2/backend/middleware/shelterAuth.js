import jwt from "jsonwebtoken";
import Shelter from "../models/shelterModel.js";

export const shelterAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "shelter")
      return res.status(403).json({ success: false, message: "Invalid role" });

    const shelter = await Shelter.findById(decoded.shelterId);
    if (!shelter)
      return res
        .status(404)
        .json({ success: false, message: "Shelter not found" });

    req.shelter = shelter;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Auth failed" });
  }
};
