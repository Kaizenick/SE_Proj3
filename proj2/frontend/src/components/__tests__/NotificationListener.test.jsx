import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotificationListener from "../NotificationListener/NotificationListener";
import { StoreContext } from "../../Context/StoreContext";
import { useSocket } from "../../Context/SocketContext";
import { toast } from "react-toastify";

// Mock the socket hook
vi.mock("../../Context/SocketContext", () => ({
  useSocket: vi.fn(),
}));

// Mock toast in case notifications are used inside component
vi.mock("react-toastify", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

const renderWithProviders = ({
  token = "mock-token",
  pathname = "/orders",
} = {}) => {
  const storeValue = {
    token,
    currency: "$",
    url: "http://localhost:4000",
  };

  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <StoreContext.Provider value={storeValue}>
        <NotificationListener />
      </StoreContext.Provider>
    </MemoryRouter>
  );
};

describe("NotificationListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // make useSocket return our mock socket each time
    useSocket.mockReturnValue(mockSocket);
  });

  it("uses socket and registers listeners when token is present", () => {
    renderWithProviders({ token: "mock-token" });

    // The component should obtain the socket instance
    expect(useSocket).toHaveBeenCalled();

    // It should register at least one listener on the socket
    expect(mockSocket.on).toHaveBeenCalled();
  });

  it("registers socket listener specifically for orderCancelled", () => {
    renderWithProviders({ token: "mock-token" });

    const hasOrderCancelledListener = mockSocket.on.mock.calls.some(
      ([eventName]) => eventName === "orderCancelled"
    );

    expect(hasOrderCancelledListener).toBe(true);
  });
});
