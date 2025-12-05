import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Shelter from "../models/shelterModel.js";
import Reroute from "../models/rerouteModel.js";

// ----------------------- LOGIN -----------------------
export const loginShelter = async (req, res) => {
  try {
    const { email, password } = req.body;
    const shelter = await Shelter.findOne({ contactEmail: email });

    if (!shelter)
      return res
        .status(404)
        .json({ success: false, message: "Shelter not found" });

    const isMatch = await shelter.matchPassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Wrong password" });

    const token = jwt.sign(
      { role: "shelter", shelterId: shelter._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, token, shelter });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ----------------------- PROFILE "ME" -----------------------
export const getShelterProfile = async (req, res) => {
  res.json({ success: true, shelter: req.shelter });
};

// ----------------------- UPDATE PROFILE -----------------------
export const updateShelterProfile = async (req, res) => {
  try {
    const updates = req.body;

    const updated = await Shelter.findByIdAndUpdate(req.shelter._id, updates, {
      new: true,
    });

    res.json({ success: true, shelter: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ----------------------- DASHBOARD STATS -----------------------
export const getDashboardStats = async (req, res) => {
  try {
    const shelterId = req.shelter._id;

    const totalDonations = await Reroute.countDocuments({
      shelterId,
      status: "accepted",
    });

    const pending = await Reroute.countDocuments({
      shelterId,
      status: "pending",
    });

    const totalValueAgg = await Reroute.aggregate([
      { $match: { shelterId, status: "accepted" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const totalValue = totalValueAgg[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalDonations,
        totalValue,
        pending,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ----------------------- PENDING ORDERS -----------------------
export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Reroute.find({
      shelterId: req.shelter._id,
      status: "pending",
    }).populate("orderId");

    res.json({ success: true, orders });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ----------------------- ACCEPT ORDER -----------------------
export const acceptOrder = async (req, res) => {
  try {
    const updated = await Reroute.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );

    res.json({ success: true, order: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ----------------------- REJECT ORDER -----------------------
export const rejectOrder = async (req, res) => {
  try {
    const updated = await Reroute.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );

    res.json({ success: true, order: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// ----------------------- DONATION HISTORY -----------------------
export const getDonationHistory = async (req, res) => {
  try {
    const donations = await Reroute.find({
      shelterId: req.shelter._id,
      status: "accepted",
    }).populate("orderId");

    res.json({ success: true, donations });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
