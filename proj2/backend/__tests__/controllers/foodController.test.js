import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import fs from "fs";
import foodModel from "../../models/foodModel.js";
import {
  listFood,
  addFood,
  removeFood,
} from "../../controllers/foodController.js";

describe("Food Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      files: {},
    };
    res = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --------------------
  // listFood
  // --------------------
  describe("listFood", () => {
    it("should list all foods and convert image/model buffers to base64", async () => {
      const doc1 = {
        toObject: () => ({
          _id: "1",
          name: "Pizza",
          description: "Cheesy",
          price: 10,
          category: "Main",
          image: { data: Buffer.from("image-1"), contentType: "image/png" },
          model3D: {
            data: Buffer.from("model-1"),
            contentType: "model/gltf-binary",
          },
        }),
      };

      const doc2 = {
        toObject: () => ({
          _id: "2",
          name: "Burger",
          description: "Juicy",
          price: 8,
          category: "Main",
          image: { data: Buffer.from("image-2"), contentType: "image/jpeg" },
          // no model3D here on purpose
        }),
      };

      jest.spyOn(foodModel, "find").mockResolvedValue([doc1, doc2]);

      await listFood(req, res);

      expect(foodModel.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
      });

      const payload = res.json.mock.calls[0][0];
      expect(payload.data).toHaveLength(2);

      const [f1, f2] = payload.data;

      expect(f1.image.data).toBe(Buffer.from("image-1").toString("base64"));
      expect(f1.model3D.data).toBe(Buffer.from("model-1").toString("base64"));

      expect(f2.image.data).toBe(Buffer.from("image-2").toString("base64"));
      expect(f2.model3D).toBeUndefined();
    });

    it("should handle errors when listing foods", async () => {
      jest.spyOn(console, "log").mockImplementation(() => {});
      jest
        .spyOn(foodModel, "find")
        .mockRejectedValue(new Error("Database error"));

      await listFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });

  // --------------------
  // addFood
  // --------------------
  describe("addFood", () => {
    it("should add food successfully with image only", async () => {
      req.body = {
        name: "New Food",
        description: "Delicious",
        price: 12.99,
        category: "Category",
      };
      req.files = {
        image: [
          {
            buffer: Buffer.from("fake-image-data"),
            mimetype: "image/png",
          },
        ],
      };

      const saveMock = jest.fn().mockResolvedValue({});
      jest.spyOn(foodModel.prototype, "save").mockImplementation(saveMock);

      await addFood(req, res);

      expect(foodModel.prototype.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Food Added",
      });
    });

    it("should add food successfully with image and 3D model", async () => {
      req.body = {
        name: "3D Food",
        description: "Has model",
        price: 20,
        category: "Category",
      };
      req.files = {
        image: [
          {
            buffer: Buffer.from("img-data"),
            mimetype: "image/jpeg",
          },
        ],
        model3D: [
          {
            buffer: Buffer.from("model-data"),
            mimetype: "model/gltf-binary",
          },
        ],
      };

      const saveMock = jest.fn().mockResolvedValue({});
      jest.spyOn(foodModel.prototype, "save").mockImplementation(saveMock);

      await addFood(req, res);

      expect(foodModel.prototype.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Food Added",
      });
    });

    it("should handle errors when adding food", async () => {
      req.body = {
        name: "Error Food",
        description: "Boom",
        price: 10,
        category: "Category",
      };
      req.files = {
        image: [
          {
            buffer: Buffer.from("img-data"),
            mimetype: "image/png",
          },
        ],
      };

      jest.spyOn(console, "log").mockImplementation(() => {});
      jest
        .spyOn(foodModel.prototype, "save")
        .mockRejectedValue(new Error("Database error"));

      await addFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });

  // --------------------
  // removeFood
  // --------------------
  describe("removeFood", () => {
    it("should remove food successfully", async () => {
      req.body = { id: "507f1f77bcf86cd799439011" };

      const mockFood = {
        _id: "507f1f77bcf86cd799439011",
        image: "image.png",
      };

      jest.spyOn(foodModel, "findById").mockResolvedValue(mockFood);
      jest.spyOn(foodModel, "findByIdAndDelete").mockResolvedValue(mockFood);

      const unlinkMock = jest
        .spyOn(fs, "unlink")
        .mockImplementation((filePath, cb) => {
          if (cb) cb(null);
        });

      await removeFood(req, res);

      expect(foodModel.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(unlinkMock).toHaveBeenCalledWith(
        "uploads/image.png",
        expect.any(Function)
      );
      expect(foodModel.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Food Removed",
      });
    });

    it("should handle errors when removing food", async () => {
      req.body = { id: "507f1f77bcf86cd799439011" };

      jest.spyOn(console, "log").mockImplementation(() => {});
      jest
        .spyOn(foodModel, "findById")
        .mockRejectedValue(new Error("Database error"));

      await removeFood(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error",
      });
    });
  });
});
