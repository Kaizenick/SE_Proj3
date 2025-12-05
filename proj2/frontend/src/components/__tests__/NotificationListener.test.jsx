// src/components/__tests__/NotificationListener.test.jsx
import React from "react";
import {
  describe,
  it,
  beforeEach,
  afterEach,
  expect,
  vi,
} from "vitest";
import {
  render,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";

// Polyfill atob for Node if needed
if (typeof global.atob === "undefined") {
  // eslint-disable-next-line no-undef
  global.atob = (str) => Buffer.from(str, "base64").toString("binary");
}

// ----------------------- Mocks -----------------------

// axios mock
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

// react-hot-toast mock
vi.mock("react-hot-toast", () => {
  const base = vi.fn();
  const custom = vi.fn();
  const success = vi.fn();
  const error = vi.fn();
  const dismiss = vi.fn();

  const toast = Object.assign(base, {
    custom,
    success,
    error,
    dismiss,
  });

  return {
    default: toast,
    __esModule: true,
  };
});

// SocketContext mock
let mockSocket;
vi.mock("../../Context/SocketContext", () => ({
  useSocket: () => mockSocket,
}));

// react-router-dom mock (only useLocation needed)
let currentPathname = "/";
vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: currentPathname }),
}));

// -------------------- Imports after mocks --------------------
import NotificationListener from "../NotificationListener/NotificationListener.jsx";
import { StoreContext } from "../../Context/StoreContext.jsx";
import axios from "axios";
import toast from "react-hot-toast";

// Helper: render with StoreContext
const renderWithStore = (storeValue) => {
  return render(
    <StoreContext.Provider value={storeValue}>
      <NotificationListener />
    </StoreContext.Provider>
  );
};

// JWT payload: {"id":"user-1"} -> base64: eyJpZCI6InVzZXItMSJ9
const TOKEN_WITH_USER_ID = "xxx.eyJpZCI6InVzZXItMSJ9.yyy";

describe("NotificationListener", () => {
  beforeEach(() => {
    mockSocket = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    };
    currentPathname = "/"; // default non-driver route

    axios.post.mockReset();
    toast.custom.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    toast.dismiss.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  // 1) No token → nothing registered
  it("does not register listeners when there is no token", () => {
    renderWithStore({
      token: "",
      currency: "$",
      url: "http://api.example.com",
    });

    expect(mockSocket.on).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
    expect(axios.post).not.toHaveBeenCalled();
  });

  // 2) Driver route → listener disabled
  it("does not listen for notifications on /driver routes", () => {
    currentPathname = "/driver/orders";

    renderWithStore({
      token: TOKEN_WITH_USER_ID,
      currency: "$",
      url: "http://api.example.com",
    });

    expect(mockSocket.on).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  // 3) Registers orderCancelled handler and shows toast
  it("registers orderCancelled handler and triggers toast.custom", () => {
    const handlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      handlers[event] = handler;
    });

    renderWithStore({
      token: TOKEN_WITH_USER_ID,
      currency: "$",
      url: "http://api.example.com",
    });

    expect(mockSocket.on).toHaveBeenCalled();
    expect(handlers.orderCancelled).toBeTypeOf("function");

    // simulate server event
    handlers.orderCancelled({
      orderId: "order-123",
      orderItems: [
        { name: "Pizza", quantity: 2, price: 15 },
        { name: "Pasta", quantity: 1, price: 12 },
      ],
    });

    // toast.custom should have been called
    expect(toast.custom).toHaveBeenCalledTimes(1);
    const [renderer, options] = toast.custom.mock.calls[0];

    expect(typeof renderer).toBe("function");
    expect(options).toEqual(
      expect.objectContaining({
        duration: 15000,
        position: "top-right",
      })
    );
  });

  // 4) Clicking "Claim Order" → axios + success toast + socket.emit + dismiss
  it('claims order and shows success toast when "Claim Order" is clicked', async () => {
    const handlers = {};
    mockSocket.on.mockImplementation((event, handler) => {
      handlers[event] = handler;
    });

    axios.post.mockResolvedValue({
      data: { success: true, message: "Order claimed successfully!" },
    });

    renderWithStore({
      token: TOKEN_WITH_USER_ID,
      currency: "$",
      url: "http://api.example.com",
    });

    // trigger the orderCancelled event to create toast
    handlers.orderCancelled({
      orderId: "order-999",
      orderItems: [{ name: "Rice Bowl", quantity: 1, price: 9 }],
    });

    expect(toast.custom).toHaveBeenCalledTimes(1);
    const [renderer] = toast.custom.mock.calls[0];

    // Render the toast's custom content into DOM
    const { getByText } = render(
      renderer({ id: "toast-1", visible: true })
    );

    const claimBtn = getByText(/Claim Order/i);

    // 🔹 Wait for async handler (axios + toast.success + socket.emit)
    await fireEvent.click(claimBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://api.example.com/api/order/claim",
        { orderId: "order-999" },
        { headers: { token: TOKEN_WITH_USER_ID } }
      );

      expect(toast.success).toHaveBeenCalledWith(
        "Order claimed successfully!"
      );

      expect(mockSocket.emit).toHaveBeenCalledWith("claimOrder", {
        orderId: "order-999",
        userId: "user-1",
      });

      expect(toast.dismiss).toHaveBeenCalledWith("toast-1");
    });
  });
});
