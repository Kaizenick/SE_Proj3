import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
/**
 * Creates a JWT token for a user
 * @param {string} id - The user's MongoDB _id
 * @returns {string} JWT token signed with JWT_SECRET
 */
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

/**
 * Authenticates a user and returns a JWT token
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

/**
 * Registers a new user account
 */
const registerUser = async (req, res) => {
  const {
    name,
    email,
    password,
    address,
    // ⭐ NEW: diet & sugar preferences from the signup form
    dietPreference = "any",
    sugarPreference = "any",
  } = req.body;

  try {
    //check if user already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // validating email format & strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      dietPreference,    // ⭐ store preference
      sugarPreference,   // ⭐ store preference
      ...(address && {
        address: {
          formatted: address.formatted,
          lat: address.lat,
          lng: address.lng,
        },
      }),
    });

    const user = await newUser.save();
    const token = createToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export const registerDriver = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "All fields are required" });
    }

    const existing = await userModel.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const newDriver = new userModel({
      name,
      email,
      password: hash,
      isDriver: true, // ⭐ mark as driver
      isAdmin: false, // drivers are NOT admins by default
      // dietPreference, sugarPreference, cartData, address use their defaults
    });

    await newDriver.save();

    return res.json({
      success: true,
      message: "Driver registered successfully",
    });
  } catch (error) {
    console.error("registerDriver error:", error);
    return res.json({
      success: false,
      message: "Error registering driver",
    });
  }
};

export const loginDriver = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    if (!user.isDriver) {
      return res.json({
        success: false,
        message: "This account is not registered as a driver",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = createToken(user._id);

    // Here we return extra info for the driver frontend
    res.json({
      success: true,
      message: "Driver login successful",
      token,
      isDriver: user.isDriver,
      isAdmin: user.isAdmin,
      name: user.name,
      dietPreference: user.dietPreference,
      sugarPreference: user.sugarPreference,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

export { loginUser, registerUser };
