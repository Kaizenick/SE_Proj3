import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../../models/userModel.js";
import {
  loginUser,
  registerUser,
  getProfile,
  updatePreferences,
  registerDriver,
  loginDriver,
} from "../../controllers/userController.js";

describe("User Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {}, query: {} };
    res = {
      json: jest.fn(),
    };
    process.env.JWT_SECRET = "test-secret-key";
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --------------------
  // registerUser
  // --------------------
  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.spyOn(validator, "isEmail").mockReturnValue(true);
      jest.spyOn(userModel, "findOne").mockResolvedValue(null);
      jest.spyOn(bcrypt, "genSalt").mockResolvedValue("salt");
      jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedPassword");

      const mockSavedUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        email: "test@example.com",
      };

      const saveMock = jest.fn().mockResolvedValue(mockSavedUser);
      jest.spyOn(userModel.prototype, "save").mockImplementation(saveMock);

      await registerUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt");
      expect(userModel.prototype.save).toHaveBeenCalled();

      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.token).toBeDefined();
    });

    it("should return error if user already exists", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      jest
        .spyOn(userModel, "findOne")
        .mockResolvedValue({ email: "test@example.com" });

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User already exists",
      });
    });

    it("should return error for invalid email", async () => {
      req.body = {
        name: "Test User",
        email: "invalid-email",
        password: "password123",
      };

      jest.spyOn(validator, "isEmail").mockReturnValue(false);
      jest.spyOn(userModel, "findOne").mockResolvedValue(null);

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please enter a valid email",
      });
    });

    it("should return error for weak password", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "short",
      };

      jest.spyOn(validator, "isEmail").mockReturnValue(true);
      jest.spyOn(userModel, "findOne").mockResolvedValue(null);

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please enter a strong password",
      });
    });

    it("should handle errors during registration", async () => {
      req.body = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.spyOn(validator, "isEmail").mockReturnValue(true);
      jest
        .spyOn(userModel, "findOne")
        .mockRejectedValue(new Error("Database error"));

      await registerUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });

  // --------------------
  // loginUser
  // --------------------
  describe("loginUser", () => {
    it("should login user successfully with correct credentials", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword",
      };

      jest.spyOn(userModel, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      await loginUser(req, res);

      expect(userModel.findOne).toHaveBeenCalledWith({
        email: "test@example.com",
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword"
      );

      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.token).toBeDefined();
    });

    it("should return error if user does not exist", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      jest.spyOn(userModel, "findOne").mockResolvedValue(null);

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User does not exist",
      });
    });

    it("should return error for invalid password", async () => {
      req.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      const mockUser = {
        _id: "507f1f77bcf86cd799439011",
        email: "test@example.com",
        password: "hashedPassword",
      };

      jest.spyOn(userModel, "findOne").mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials",
      });
    });

    it("should handle errors during login", async () => {
      req.body = {
        email: "test@example.com",
        password: "password123",
      };

      jest.spyOn(console, "log").mockImplementation(() => {});
      jest
        .spyOn(userModel, "findOne")
        .mockRejectedValue(new Error("Database error"));

      await loginUser(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });

  // --------------------
  // getProfile
  // --------------------
  describe("getProfile", () => {
    it("should reject when userId is missing", async () => {
      req.body = {}; // no userId

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not authenticated",
      });
    });

    it("should return user profile when user exists", async () => {
      req.body = { userId: "user123" };

      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
        address: { formatted: "Addr" },
        dietPreference: "any",
        sugarPreference: "any",
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(userModel, "findById").mockReturnValue({
        select: selectMock,
      });

      await getProfile(req, res);

      expect(userModel.findById).toHaveBeenCalledWith("user123");
      expect(selectMock).toHaveBeenCalledWith(
        "name email address dietPreference sugarPreference"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    it("should return error when user not found", async () => {
      req.body = { userId: "user123" };

      const selectMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(userModel, "findById").mockReturnValue({
        select: selectMock,
      });

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
      });
    });

    it("should handle errors while fetching profile", async () => {
      req.body = { userId: "user123" };

      jest.spyOn(console, "error").mockImplementation(() => {});
      jest.spyOn(userModel, "findById").mockImplementation(() => {
        throw new Error("Database error");
      });

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching profile",
      });
    });
  });

  // --------------------
  // updatePreferences
  // --------------------
  describe("updatePreferences", () => {
    it("should reject when userId is missing", async () => {
      req.body = {
        dietPreference: "veg-only",
        sugarPreference: "no-sweets",
      };

      await updatePreferences(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not authenticated",
      });
    });

    it("should update preferences with valid values", async () => {
      req.body = {
        userId: "user123",
        dietPreference: "veg-only",
        sugarPreference: "no-sweets",
      };

      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com",
        dietPreference: "veg-only",
        sugarPreference: "no-sweets",
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(userModel, "findByIdAndUpdate").mockReturnValue({
        select: selectMock,
      });

      await updatePreferences(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        {
          dietPreference: "veg-only",
          sugarPreference: "no-sweets",
        },
        { new: true }
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Preferences updated successfully",
        data: mockUser,
      });
    });

    it("should normalize invalid preferences to 'any'", async () => {
      req.body = {
        userId: "user123",
        dietPreference: "something-weird",
        sugarPreference: "super-sweet",
      };

      const mockUser = {
        _id: "user123",
        dietPreference: "any",
        sugarPreference: "any",
      };

      const selectMock = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(userModel, "findByIdAndUpdate").mockReturnValue({
        select: selectMock,
      });

      await updatePreferences(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "user123",
        {
          dietPreference: "any",
          sugarPreference: "any",
        },
        { new: true }
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Preferences updated successfully",
        data: mockUser,
      });
    });

    it("should return error when user not found", async () => {
      req.body = {
        userId: "user123",
        dietPreference: "veg-only",
        sugarPreference: "no-sweets",
      };

      const selectMock = jest.fn().mockResolvedValue(null);
      jest.spyOn(userModel, "findByIdAndUpdate").mockReturnValue({
        select: selectMock,
      });

      await updatePreferences(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User not found",
      });
    });

    it("should handle errors while updating preferences", async () => {
      req.body = {
        userId: "user123",
        dietPreference: "veg-only",
        sugarPreference: "no-sweets",
      };

      jest.spyOn(console, "error").mockImplementation(() => {});
      jest.spyOn(userModel, "findByIdAndUpdate").mockImplementation(() => {
        throw new Error("Database error");
      });

      await updatePreferences(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error updating preferences",
      });
    });
  });

  // --------------------
  // registerDriver
  // --------------------
  describe("registerDriver", () => {
    it("should require all fields", async () => {
      req.body = {
        name: "",
        email: "",
        password: "",
      };

      await registerDriver(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "All fields are required",
      });
    });

    it("should reject when email already registered", async () => {
      req.body = {
        name: "Driver",
        email: "driver@example.com",
        password: "password123",
      };

      jest
        .spyOn(userModel, "findOne")
        .mockResolvedValue({ email: "driver@example.com" });

      await registerDriver(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Email already registered",
      });
    });

    it("should register driver successfully", async () => {
      req.body = {
        name: "Driver",
        email: "driver@example.com",
        password: "password123",
      };

      jest.spyOn(userModel, "findOne").mockResolvedValue(null);
      jest.spyOn(bcrypt, "hash").mockResolvedValue("hashedDriverPassword");

      const saveMock = jest.fn().mockResolvedValue({
        _id: "driver123",
        name: "Driver",
        email: "driver@example.com",
        isDriver: true,
        isAdmin: false,
      });
      jest.spyOn(userModel.prototype, "save").mockImplementation(saveMock);

      await registerDriver(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(userModel.prototype.save).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Driver registered successfully",
      });
    });

    it("should handle errors during driver registration", async () => {
      req.body = {
        name: "Driver",
        email: "driver@example.com",
        password: "password123",
      };

      jest.spyOn(console, "error").mockImplementation(() => {});
      jest
        .spyOn(userModel, "findOne")
        .mockRejectedValue(new Error("Database error"));

      await registerDriver(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error registering driver",
      });
    });
  });

  // --------------------
  // loginDriver
  // --------------------
  describe("loginDriver", () => {
    it("should reject when user does not exist", async () => {
      req.body = {
        email: "driver@example.com",
        password: "password123",
      };

      jest.spyOn(userModel, "findOne").mockResolvedValue(null);

      await loginDriver(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "User does not exist",
      });
    });

    it("should reject when user is not a driver", async () => {
      req.body = {
        email: "user@example.com",
        password: "password123",
      };

      jest.spyOn(userModel, "findOne").mockResolvedValue({
        email: "user@example.com",
        password: "hashed",
        isDriver: false,
      });

      await loginDriver(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "This account is not registered as a driver",
      });
    });

    it("should reject invalid driver credentials", async () => {
      req.body = {
        email: "driver@example.com",
        password: "wrongpass",
      };

      jest.spyOn(userModel, "findOne").mockResolvedValue({
        email: "driver@example.com",
        password: "hashedPassword",
        isDriver: true,
      });
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      await loginDriver(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid credentials",
      });
    });

    it("should login driver successfully", async () => {
      req.body = {
        email: "driver@example.com",
        password: "password123",
      };

      const mockDriver = {
        _id: "driver123",
        name: "Driver",
        email: "driver@example.com",
        password: "hashedPassword",
        isDriver: true,
        isAdmin: false,
        dietPreference: "any",
        sugarPreference: "any",
      };

      jest.spyOn(userModel, "findOne").mockResolvedValue(mockDriver);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      await loginDriver(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.token).toBeDefined();
      expect(payload.isDriver).toBe(true);
      expect(payload.isAdmin).toBe(false);
      expect(payload.name).toBe("Driver");
      expect(payload.dietPreference).toBe("any");
      expect(payload.sugarPreference).toBe("any");
    });

    it("should handle errors during driver login", async () => {
      req.body = {
        email: "driver@example.com",
        password: "password123",
      };

      jest.spyOn(console, "error").mockImplementation(() => {});
      jest
        .spyOn(userModel, "findOne")
        .mockRejectedValue(new Error("Database error"));

      await loginDriver(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });
});
