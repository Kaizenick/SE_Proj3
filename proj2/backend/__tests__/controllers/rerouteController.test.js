import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import rerouteModel from "../../models/rerouteModel.js";
import { listReroutes } from "../../controllers/rerouteController.js";

describe("Reroute Controller", () => {
  let req;
  let res;

  const makeFindMock = (rows) => {
    return jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(rows),
        }),
      }),
    });
  };

  beforeEach(() => {
    req = { query: {} };
    res = {
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("listReroutes", () => {
    it("should list reroutes with default pagination", async () => {
      const mockReroutes = [
        { _id: "1", orderId: "order1", shelterId: "shelter1" },
        { _id: "2", orderId: "order2", shelterId: "shelter2" },
      ];

      rerouteModel.find = makeFindMock(mockReroutes);
      rerouteModel.countDocuments = jest.fn().mockResolvedValue(2);

      await listReroutes(req, res);

      expect(rerouteModel.find).toHaveBeenCalledWith({});
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReroutes,
        page: 1,
        limit: 20,
        total: 2,
      });
    });

    it("should handle custom pagination parameters", async () => {
      req.query = { page: "2", limit: "10" };
      const mockReroutes = [{ _id: "1" }];

      rerouteModel.find = makeFindMock(mockReroutes);
      rerouteModel.countDocuments = jest.fn().mockResolvedValue(15);

      await listReroutes(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReroutes,
        page: 2,
        limit: 10,
        total: 15,
      });
    });

    it("should enforce minimum page value (page <= 0 → 1)", async () => {
      req.query = { page: "0", limit: "5" };
      const mockReroutes = [];

      rerouteModel.find = makeFindMock(mockReroutes);
      rerouteModel.countDocuments = jest.fn().mockResolvedValue(0);

      await listReroutes(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 5 })
      );
    });

    it("should enforce maximum limit value (limit > 100 → 100)", async () => {
      req.query = { page: "1", limit: "200" };
      const mockReroutes = [];

      rerouteModel.find = makeFindMock(mockReroutes);
      rerouteModel.countDocuments = jest.fn().mockResolvedValue(0);

      await listReroutes(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 100 })
      );
    });

    it("should handle errors and return failure response", async () => {
      // Spy to avoid noisy console.error in test output
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      rerouteModel.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      });

      await listReroutes(req, res);

      expect(consoleSpy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching reroutes",
      });
    });
  });
});
