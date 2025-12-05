import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

// ---- Safe mocks (no outer variables used inside vi.mock) ----

vi.mock("axios", () => {
  return {
    default: {
      post: vi.fn(),
    },
    __esModule: true,
  };
});

vi.mock("react-hot-toast", () => {
  const toastFn = vi.fn();
  const success = vi.fn();
  const error = vi.fn();

  const toast = Object.assign(toastFn, {
    success,
    error,
  });

  return {
    default: toast, // default import
    toast,          // named import
    __esModule: true,
  };
});

// ---- Imports AFTER mocks ----
import axios from "axios";
import toast from "react-hot-toast";
import RateOrderModal from "../RateOrderModal/RateOrderModal.jsx";
import { StoreContext } from "../../Context/StoreContext.jsx";

const sampleOrder = {
  _id: "order-123",
  items: [{ name: "Pizza" }, { name: "Pasta" }],
  rating: 0,
  feedback: "",
};

const renderWithStore = (ui, { url = "http://api.example.com", token = "test-token" } = {}) =>
  render(
    <StoreContext.Provider value={{ url, token }}>
      {ui}
    </StoreContext.Provider>
  );

describe("RateOrderModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders title and order items", () => {
    renderWithStore(
      <RateOrderModal order={sampleOrder} onClose={vi.fn()} onRated={vi.fn()} />
    );

    expect(screen.getByText("Rate your order")).toBeInTheDocument();
    expect(screen.getByText("Pizza, Pasta")).toBeInTheDocument();
    expect(screen.getByText("Submit rating")).toBeInTheDocument();
  });

  it("calls onClose when × is clicked", () => {
    const onClose = vi.fn();

    renderWithStore(
      <RateOrderModal order={sampleOrder} onClose={onClose} onRated={vi.fn()} />
    );

    const closeBtn = screen.getByRole("button", { name: "×" });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows error toast if submitting with no rating", async () => {
    renderWithStore(
      <RateOrderModal
        order={{ ...sampleOrder, rating: 0 }}
        onClose={vi.fn()}
        onRated={vi.fn()}
      />
    );

    const submitBtn = screen.getByText("Submit rating");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please select a rating");
    });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("submits rating successfully and calls onRated + toast.success", async () => {
    const onRated = vi.fn();

    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ...sampleOrder,
          rating: 5,
          feedback: "Great!",
        },
      },
    });

    renderWithStore(
      <RateOrderModal order={sampleOrder} onClose={vi.fn()} onRated={onRated} />
    );

    // pick the 5th star (index 4)
    const star5 = screen.getAllByText("☆")[4];
    fireEvent.click(star5);

    const textarea = screen.getByPlaceholderText("Optional feedback");
    fireEvent.change(textarea, { target: { value: "Great!" } });

    const submitBtn = screen.getByText("Submit rating");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "http://api.example.com/api/order/rate",
        {
          orderId: "order-123",
          rating: 5,
          feedback: "Great!",
        },
        {
          headers: { token: "test-token" },
        }
      );

      expect(toast.success).toHaveBeenCalledWith("Thanks for your feedback!");
      expect(onRated).toHaveBeenCalledTimes(1);
      expect(onRated).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 5, feedback: "Great!" })
      );
    });
  });

  it("shows API error toast when success:false", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Could not submit rating" },
    });

    renderWithStore(
      <RateOrderModal order={sampleOrder} onClose={vi.fn()} onRated={vi.fn()} />
    );

    const star3 = screen.getAllByText("☆")[2];
    fireEvent.click(star3);

    const submitBtn = screen.getByText("Submit rating");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Could not submit rating");
    });
  });

  it("shows fallback error toast when request throws", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    renderWithStore(
      <RateOrderModal order={sampleOrder} onClose={vi.fn()} onRated={vi.fn()} />
    );

    const star4 = screen.getAllByText("☆")[3];
    fireEvent.click(star4);

    const submitBtn = screen.getByText("Submit rating");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong while rating"
      );
    });
  });
});
