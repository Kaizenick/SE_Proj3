// src/pages/__tests__/Cart.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Cart from "../Cart/Cart";
import { StoreContext } from "../../Context/StoreContext";

// Mock useNavigate so we can assert navigation
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const baseStoreContext = {
  cartItems: {},
  food_list: [],
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  getTotalCartAmount: vi.fn(() => 0),
  url: "http://localhost:4000",
  currency: "$",
  deliveryCharge: 5,
};

const renderWithStore = (overrides = {}) => {
  const value = { ...baseStoreContext, ...overrides };
  return render(
    <MemoryRouter>
      <StoreContext.Provider value={value}>
        <Cart />
      </StoreContext.Provider>
    </MemoryRouter>
  );
};

describe("Cart Page", () => {
  beforeEach(() => {
    mockNavigate.mockReset();

    // reset base context spies & values
    baseStoreContext.cartItems = {};
    baseStoreContext.food_list = [];
    baseStoreContext.addToCart = vi.fn();
    baseStoreContext.removeFromCart = vi.fn();
    baseStoreContext.getTotalCartAmount = vi.fn(() => 0);
    baseStoreContext.url = "http://localhost:4000";
    baseStoreContext.currency = "$";
    baseStoreContext.deliveryCharge = 5;
  });

  it("shows empty state when cart is empty", () => {
    baseStoreContext.getTotalCartAmount = vi.fn(() => 0);
    baseStoreContext.cartItems = {};
    baseStoreContext.food_list = [];

    renderWithStore();

    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(
      screen.getByText("Add something tasty to get started.")
    ).toBeInTheDocument();

    const browseButton = screen.getByRole("button", { name: /browse menu/i });
    expect(browseButton).toBeInTheDocument();
  });

  it("disables checkout and shows zero totals when cart is empty", () => {
    baseStoreContext.getTotalCartAmount = vi.fn(() => 0);
    baseStoreContext.cartItems = {};
    baseStoreContext.food_list = [];

    renderWithStore();

    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Delivery Fee")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();

    // There are multiple "$0" texts (subtotal, delivery, total).
    // Match by normalizing whitespace.
    const zeroValues = screen.getAllByText((content, node) => {
      const text = node.textContent.replace(/\s+/g, "");
      return text === "$0";
    });
    expect(zeroValues.length).toBeGreaterThanOrEqual(3);

    const checkoutBtn = screen.getByRole("button", {
      name: /add items to checkout/i,
    });
    expect(checkoutBtn).toBeDisabled();

    fireEvent.click(checkoutBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows items table when cart has items", () => {
    const cartItems = { food1: 2 };
    const food_list = [
      {
        _id: "food1",
        name: "Test Pizza",
        price: 10,
        image: "pizza.jpg",
      },
    ];

    baseStoreContext.getTotalCartAmount = vi.fn(() => 20);

    renderWithStore({
      cartItems,
      food_list,
    });

    // Table header
    expect(screen.getByText(/Items/i)).toBeInTheDocument();
    expect(screen.getByText(/Title/i)).toBeInTheDocument();
    expect(screen.getByText(/Price/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity/i)).toBeInTheDocument();
    // "Total" appears in multiple places; we just need at least one header cell
    const totalHeaderCells = screen.getAllByText((content, node) => {
      return node.textContent.trim() === "Total";
    });
    expect(totalHeaderCells.length).toBeGreaterThanOrEqual(1);

    // "Remove" appears both as header and button
    const removeTexts = screen.getAllByText(/Remove/i);
    expect(removeTexts.length).toBeGreaterThanOrEqual(2);

    // Item row
    expect(screen.getByText("Test Pizza")).toBeInTheDocument();
    expect(screen.getByText("$10")).toBeInTheDocument(); // unit price
    expect(screen.getByText("2")).toBeInTheDocument(); // quantity value

    // "$20" appears twice: row total and summary subtotal.
    const twenties = screen.getAllByText((content, node) => {
      const text = node.textContent.replace(/\s+/g, "");
      return text === "$20";
    });
    expect(twenties.length).toBeGreaterThanOrEqual(2);

    // Summary totals: subtotal = 20, deliveryFee = 5, total = 25
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Delivery Fee")).toBeInTheDocument();
    expect(screen.getByText("$5")).toBeInTheDocument();
    expect(screen.getByText("$25")).toBeInTheDocument();
  });

  it("calls removeFromCart and addToCart when quantity buttons are clicked", () => {
    const cartItems = { food1: 2 };
    const food_list = [
      {
        _id: "food1",
        name: "Test Pizza",
        price: 10,
        image: "pizza.jpg",
      },
    ];

    baseStoreContext.getTotalCartAmount = vi.fn(() => 20);

    renderWithStore({
      cartItems,
      food_list,
    });

    const minusBtn = screen.getByRole("button", { name: "−" });
    const plusBtn = screen.getByRole("button", { name: "+" });

    fireEvent.click(minusBtn);
    expect(baseStoreContext.removeFromCart).toHaveBeenCalledWith("food1");

    fireEvent.click(plusBtn);
    expect(baseStoreContext.addToCart).toHaveBeenCalledWith("food1");
  });

  it("calls removeFromCart when Remove button is clicked", () => {
    const cartItems = { food1: 1 };
    const food_list = [
      {
        _id: "food1",
        name: "Test Pizza",
        price: 10,
        image: "pizza.jpg",
      },
    ];

    baseStoreContext.getTotalCartAmount = vi.fn(() => 10);

    renderWithStore({
      cartItems,
      food_list,
    });

    const removeBtn = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeBtn);

    expect(baseStoreContext.removeFromCart).toHaveBeenCalledWith("food1");
  });

  it("enables checkout and navigates to /order when cart has items", () => {
    const cartItems = { food1: 1 };
    const food_list = [
      {
        _id: "food1",
        name: "Test Pizza",
        price: 10,
        image: "pizza.jpg",
      },
    ];

    baseStoreContext.getTotalCartAmount = vi.fn(() => 10);

    renderWithStore({
      cartItems,
      food_list,
    });

    const checkoutBtn = screen.getByRole("button", {
      name: /proceed to checkout/i,
    });

    expect(checkoutBtn).not.toBeDisabled();

    fireEvent.click(checkoutBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/order");
  });
});
