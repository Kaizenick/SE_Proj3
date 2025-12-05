// frontend/src/pages/__tests__/MyOrders.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";

import MyOrders from "../MyOrders/MyOrders.jsx";
import { StoreContext } from "../../Context/StoreContext.jsx";

// ---- mocks ----
vi.mock("axios");

vi.mock("../../Context/SocketContext", () => ({
  __esModule: true,
  useSocket: () => null, // keep socket logic inert for these tests
}));

// Mock RateOrderModal so we can easily trigger onRated
vi.mock("../../components/RateOrderModal/RateOrderModal", () => ({
  __esModule: true,
  default: ({ order, onClose, onRated }) => (
    <div data-testid="rate-modal">
      <p>Mock RateOrderModal for {order._id}</p>
      <button
        onClick={() =>
          onRated &&
          onRated({
            ...order,
            rating: 5,
            feedback: "Great!",
          })
        }
      >
        Mock Submit Rating
      </button>
      <button onClick={onClose}>Mock Close</button>
    </div>
  ),
}));

const baseStoreContext = {
  token: "mock-token",
  url: "http://localhost:4000",
  currency: "$",
};

const renderWithProviders = (ui, overrideStore = {}) => {
  const value = { ...baseStoreContext, ...overrideStore };
  return render(
    <BrowserRouter>
      <StoreContext.Provider value={value}>{ui}</StoreContext.Provider>
    </BrowserRouter>
  );
};

describe("MyOrders Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.post.mockReset();
  });

  it("fetches user orders on mount when token is present", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    renderWithProviders(<MyOrders />);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:4000/api/order/userorders",
        {},
        { headers: { token: "mock-token" } }
      );
    });

    expect(screen.getByText(/My Orders/i)).toBeInTheDocument();
  });

  it("does not fetch orders when there is no token", async () => {
    renderWithProviders(<MyOrders />, { token: "" });

    // give effects time to run
    await new Promise((r) => setTimeout(r, 50));

    expect(axios.post).not.toHaveBeenCalled();
  });

  it("displays a simple order with price and items", async () => {
    const mockOrders = [
      {
        _id: "order1",
        userId: "user123",
        items: [{ name: "Food 1", quantity: 2 }],
        amount: 25.99,
        originalAmount: 25.99,
        status: "Food Preparing",
        date: new Date().toISOString(),
      },
    ];

    axios.post.mockResolvedValueOnce({
      data: { success: true, data: mockOrders },
    });

    renderWithProviders(<MyOrders />);

    // Wait for orders to load
    await screen.findByText("Food 1 x 2");

    // Items count
    expect(screen.getByText("Items: 1")).toBeInTheDocument();

    // Price column (no discount -> just $25.99)
    expect(screen.getByText("$25.99")).toBeInTheDocument();

    // Status text
    expect(screen.getByText(/Status:/i)).toBeInTheDocument();

    // Cancel button should be enabled for Food Preparing
    const cancelBtn = screen.getByRole("button", { name: /cancel order/i });
    expect(cancelBtn).not.toBeDisabled();
  });

  it("cancels an order and refreshes the list", async () => {
    const mockOrders = [
      {
        _id: "order2",
        userId: "user123",
        items: [{ name: "Meal", quantity: 1 }],
        amount: 10,
        originalAmount: 10,
        status: "Food Preparing",
        date: new Date().toISOString(),
      },
    ];

    // 1st call: initial /userorders
    axios.post
      .mockResolvedValueOnce({
        data: { success: true, data: mockOrders },
      })
      // 2nd call: /cancel_order
      .mockResolvedValueOnce({
        data: { success: true, message: "Order cancelled successfully" },
      })
      // 3rd call: /userorders after cancellation refresh
      .mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

    renderWithProviders(<MyOrders />);

    // Wait for initial orders
    await screen.findByText("Meal x 1");

    const cancelBtn = screen.getByRole("button", { name: /cancel order/i });
    fireEvent.click(cancelBtn);

    // We expect 3 calls in total: initial userorders, cancel_order, refreshed userorders
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(3);
    });

    // Second call should be cancel_order
    expect(axios.post.mock.calls[1][0]).toBe(
      "http://localhost:4000/api/order/cancel_order"
    );
  });

  it("disables cancel button for cancelled orders", async () => {
    const mockOrders = [
      {
        _id: "order3",
        userId: "user123",
        items: [{ name: "Old Order", quantity: 1 }],
        amount: 10,
        originalAmount: 10,
        status: "Cancelled",
        date: new Date().toISOString(),
      },
    ];

    axios.post.mockResolvedValueOnce({
      data: { success: true, data: mockOrders },
    });

    renderWithProviders(<MyOrders />);

    await screen.findByText("Old Order x 1");

    const cancelBtn = screen.getByRole("button", { name: /cancelled/i });
    expect(cancelBtn).toBeDisabled();
  });

  it("shows Rate order button for delivered orders without rating and opens modal", async () => {
    const mockOrders = [
      {
        _id: "order4",
        userId: "user123",
        items: [{ name: "Rated Food", quantity: 1 }],
        amount: 15,
        originalAmount: 15,
        status: "Delivered",
        rating: undefined,
        feedback: undefined,
        date: new Date().toISOString(),
      },
    ];

    axios.post.mockResolvedValueOnce({
      data: { success: true, data: mockOrders },
    });

    renderWithProviders(<MyOrders />);

    await screen.findByText("Rated Food x 1");

    const rateBtn = screen.getByRole("button", { name: /rate order/i });
    expect(rateBtn).toBeInTheDocument();

    fireEvent.click(rateBtn);

    // Mock modal should appear
    const modal = await screen.findByTestId("rate-modal");
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent("Mock RateOrderModal for order4");
  });

  it("updates order with rating after modal onRated is called", async () => {
    const mockOrders = [
      {
        _id: "order5",
        userId: "user123",
        items: [{ name: "Fancy Meal", quantity: 1 }],
        amount: 20,
        originalAmount: 20,
        status: "Delivered",
        rating: undefined,
        feedback: undefined,
        date: new Date().toISOString(),
      },
    ];

    axios.post.mockResolvedValueOnce({
      data: { success: true, data: mockOrders },
    });

    renderWithProviders(<MyOrders />);

    await screen.findByText("Fancy Meal x 1");

    const rateBtn = screen.getByRole("button", { name: /rate order/i });
    fireEvent.click(rateBtn);

    const modal = await screen.findByTestId("rate-modal");
    const submitBtn = screen.getByRole("button", {
      name: /mock submit rating/i,
    });

    // Trigger onRated from mocked modal
    fireEvent.click(submitBtn);

    // Modal should disappear and rating stars should show
    await waitFor(() => {
      expect(screen.queryByTestId("rate-modal")).not.toBeInTheDocument();
      // ★★★★★ from order.rating = 5
      expect(screen.getByText("★★★★★")).toBeInTheDocument();
    });

    // Rate button should go away after rating is set
    expect(screen.queryByRole("button", { name: /rate order/i })).toBeNull();
  });
});
