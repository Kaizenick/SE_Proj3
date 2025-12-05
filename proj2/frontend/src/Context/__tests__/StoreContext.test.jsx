// frontend/src/Context/__tests__/StoreContext.test.jsx
import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import StoreContextProvider, { StoreContext } from "../StoreContext.jsx";
import axios from "axios";

// Auto-mock axios so axios.get / axios.post are jest-style mocks
vi.mock("axios");

describe("StoreContextProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset axios mocks
    axios.get.mockReset();
    axios.post.mockReset();
    // clean localStorage
    localStorage.clear();
  });

  const renderWithProvider = (ui) =>
    render(<StoreContextProvider>{ui}</StoreContextProvider>);

  // Small helper consumer to inspect context values
  const ContextSpy = ({ onReady }) => {
    const ctx = React.useContext(StoreContext);
    React.useEffect(() => {
      if (onReady) onReady(ctx);
    }, [ctx, onReady]);
    return null;
  };

  // -----------------------------
  // 1. loads food list on mount
  // -----------------------------
  it("loads food list from backend on mount", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          { _id: "1", name: "Pizza", price: 10 },
          { _id: "2", name: "Burger", price: 8 },
        ],
      },
    });

    const TestConsumer = () => {
      const { food_list } = React.useContext(StoreContext);
      return <div>items-count:{food_list.length}</div>;
    };

    renderWithProvider(<TestConsumer />);

    await waitFor(() =>
      expect(screen.getByText("items-count:2")).toBeInTheDocument()
    );

    expect(axios.get).toHaveBeenCalledWith(
      "http://localhost:4000/api/food/list"
    );
  });

  // -----------------------------------------------
  // 2. when token in localStorage, loads cart data
  // -----------------------------------------------
  it("loads cart data when token exists in localStorage", async () => {
    localStorage.setItem("token", "valid-token");

    axios.get.mockResolvedValueOnce({
      data: {
        data: [{ _id: "1", name: "Pizza", price: 10 }],
      },
    });

    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        cartData: { 1: 2 },
      },
    });

    let ctxRef = null;
    renderWithProvider(
      <ContextSpy
        onReady={(ctx) => {
          ctxRef = ctx;
        }}
      />
    );

    await waitFor(() => {
      expect(ctxRef).not.toBeNull();
      expect(ctxRef.food_list.length).toBe(1);
      expect(ctxRef.token).toBe("valid-token");
      expect(ctxRef.cartItems).toEqual({ 1: 2 });
    });

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:4000/api/cart/get",
      {},
      { headers: { token: "valid-token" } }
    );
  });

  // ------------------------------------------------------
  // 3. loadCartData resets token + cart when response bad
  // ------------------------------------------------------
  it("loadCartData clears cart and token when backend reports failure", async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: [] },
    });

    let ctxRef = null;
    renderWithProvider(
      <ContextSpy
        onReady={(ctx) => {
          ctxRef = ctx;
        }}
      />
    );

    await waitFor(() => expect(ctxRef).not.toBeNull());

    // simulate user already having a token
    act(() => {
      ctxRef.setToken("bad-token");
    });

    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
      },
    });

    await act(async () => {
      await ctxRef.loadCartData({ token: "bad-token" });
    });

    await waitFor(() => {
      expect(ctxRef.cartItems).toEqual({});
      expect(ctxRef.token).toBe("");
    });
  });

  // ---------------------------------------------------------
  // 4. loadCartData clears on network error (catch branch)
  // ---------------------------------------------------------
  it("loadCartData clears cart and token on network error", async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: [] },
    });

    let ctxRef = null;
    renderWithProvider(
      <ContextSpy
        onReady={(ctx) => {
          ctxRef = ctx;
        }}
      />
    );

    await waitFor(() => expect(ctxRef).not.toBeNull());

    act(() => {
      ctxRef.setToken("bad-token-2");
    });

    axios.post.mockRejectedValueOnce(new Error("Network error"));

    await act(async () => {
      await ctxRef.loadCartData({ token: "bad-token-2" });
    });

    await waitFor(() => {
      expect(ctxRef.cartItems).toEqual({});
      expect(ctxRef.token).toBe("");
    });
  });

  // -----------------------------------------
  // 5. addToCart updates cart + calls backend
  // -----------------------------------------
  it("addToCart increments quantity and calls backend when token present", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [{ _id: "1", name: "Pizza", price: 10 }],
      },
    });

    axios.post.mockResolvedValue({ data: { success: true } });

    let ctxRef = null;
    const TestConsumer = () => {
      const ctx = React.useContext(StoreContext);
      ctxRef = ctx;
      return <div>total={ctx.getTotalCartAmount()}</div>;
    };

    renderWithProvider(<TestConsumer />);

    await waitFor(() => expect(ctxRef).not.toBeNull());

    // set token so addToCart will call backend
    act(() => {
      ctxRef.setToken("abc-token");
    });

    await act(async () => {
      await ctxRef.addToCart("1");
    });

    await waitFor(() => {
      expect(ctxRef.cartItems["1"]).toBe(1);
      // total = price(10) * qty(1)
      expect(ctxRef.getTotalCartAmount()).toBe(10);
    });

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:4000/api/cart/add",
      { itemId: "1" },
      { headers: { token: "abc-token" } }
    );
  });

  // ---------------------------------------------
  // 6. removeFromCart decrements & syncs backend
  // ---------------------------------------------
  it("removeFromCart decrements quantity and calls backend when token present", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [{ _id: "1", name: "Pizza", price: 10 }],
      },
    });

    axios.post.mockResolvedValue({ data: { success: true } });

    let ctxRef = null;
    renderWithProvider(
      <ContextSpy
        onReady={(ctx) => {
          ctxRef = ctx;
        }}
      />
    );

    await waitFor(() => expect(ctxRef).not.toBeNull());

    act(() => {
      ctxRef.setToken("abc-token");
      ctxRef.setCartItems({ 1: 2 });
    });

    await act(async () => {
      await ctxRef.removeFromCart("1");
    });

    await waitFor(() => {
      expect(ctxRef.cartItems["1"]).toBe(1);
    });

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:4000/api/cart/remove",
      { itemId: "1" },
      { headers: { token: "abc-token" } }
    );
  });

  // --------------------------------------------------
  // 7. getTotalCartAmount ignores unknown item ids
  // --------------------------------------------------
  it("getTotalCartAmount sums only known food items", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        data: [
          { _id: "1", name: "Pizza", price: 10 },
          { _id: "2", name: "Burger", price: 5 },
        ],
      },
    });

    let ctxRef = null;
    const TestConsumer = () => {
      const ctx = React.useContext(StoreContext);
      ctxRef = ctx;
      const total = ctx.getTotalCartAmount();
      return <div>total={total}</div>;
    };

    renderWithProvider(<TestConsumer />);

    await waitFor(() => expect(ctxRef).not.toBeNull());

    // set cart: 2x item "1" (price 10), 3x unknown item "999"
    act(() => {
      ctxRef.setCartItems({ 1: 2, 999: 3 });
    });

    // re-read total after state update
    await waitFor(() => {
      const txt = screen.getByText(/total=/).textContent;
      // getTotalCartAmount should compute 2 * 10 = 20
      expect(ctxRef.getTotalCartAmount()).toBe(20);
      expect(txt).toBe("total=20");
    });
  });

  // --------------------------------------------------
  // 8. exposes searchTerm & setSearchTerm correctly
  // --------------------------------------------------
  it("exposes searchTerm and setSearchTerm in context", async () => {
    axios.get.mockResolvedValueOnce({
      data: { data: [] },
    });

    let ctxRef = null;
    const TestConsumer = () => {
      const ctx = React.useContext(StoreContext);
      ctxRef = ctx;
      return <div>search={ctx.searchTerm}</div>;
    };

    renderWithProvider(<TestConsumer />);

    await waitFor(() => expect(ctxRef).not.toBeNull());
    expect(screen.getByText("search=")).toBeInTheDocument();

    act(() => {
      ctxRef.setSearchTerm("pizza");
    });

    await waitFor(() => {
      expect(ctxRef.searchTerm).toBe("pizza");
      expect(screen.getByText("search=pizza")).toBeInTheDocument();
    });
  });
});
