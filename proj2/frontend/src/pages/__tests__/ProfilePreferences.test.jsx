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

// --- Mocks ---

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
  __esModule: true,
}));

vi.mock("react-toastify", () => {
  const error = vi.fn();
  const success = vi.fn();
  return {
    toast: { error, success },
    __esModule: true,
  };
});

import axios from "axios";
import { toast } from "react-toastify";
import ProfilePreferences from "../Profile/Profile.jsx";
import { StoreContext } from "../../Context/StoreContext.jsx";

// Helper to render with StoreContext
const renderWithStore = (ctxValue) => {
  return render(
    <StoreContext.Provider value={ctxValue}>
      <ProfilePreferences />
    </StoreContext.Provider>
  );
};

describe("ProfilePreferences page", () => {
  const API_URL = "http://test-api";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows sign-in prompt when there is no token", () => {
    renderWithStore({ url: API_URL, token: null });

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(
      screen.getByText("Please sign in to view your profile.")
    ).toBeInTheDocument();
  });

  it("loads profile and populates fields when token is present", async () => {
    // First axios.post call: /api/user/profile
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          name: "Alice",
          dietPreference: "veg-only",
          sugarPreference: "no-sweets",
        },
      },
    });

    renderWithStore({ url: API_URL, token: "test-token" });

    // Verify profile API call
    expect(axios.post).toHaveBeenCalledWith(
      `${API_URL}/api/user/profile`,
      {},
      { headers: { token: "test-token" } }
    );

    // Wait until the name field is populated
    await waitFor(() => {
      expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    });

    // Diet select should show "Vegetarian only"
    expect(
      screen.getByDisplayValue("Vegetarian only")
    ).toBeInTheDocument();

    // Sugar select should show sugar-free option
    expect(
      screen.getByDisplayValue(
        "Avoid sweets / desserts (sugar-free)"
      )
    ).toBeInTheDocument();

    // No toast error on success path
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("handles error when loading profile", async () => {
    axios.post.mockRejectedValueOnce(new Error("Network error"));

    renderWithStore({ url: API_URL, token: "test-token" });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load profile"
      );
    });
  });

  it("saves preferences and shows success toast", async () => {
    // 1st axios.post -> /profile
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          name: "Bob",
          dietPreference: "any",
          sugarPreference: "any",
        },
      },
    });

    // 2nd axios.post -> /preferences
    axios.post.mockResolvedValueOnce({
      data: { success: true },
    });

    renderWithStore({ url: API_URL, token: "test-token" });

    // Wait until profile is loaded
    await waitFor(() => {
      expect(screen.getByDisplayValue("Bob")).toBeInTheDocument();
    });

    // Change diet and sugar selects
    fireEvent.change(
      screen.getByDisplayValue("No diet preference"),
      { target: { value: "veg-only" } }
    );

    fireEvent.change(
      screen.getByDisplayValue("Okay with sweets / desserts"),
      { target: { value: "no-sweets" } }
    );

    // Click "Save preferences" button
    fireEvent.click(
      screen.getByRole("button", { name: /save preferences/i })
    );

    // 2nd call should be /preferences with updated values
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(2);
    });

    expect(axios.post).toHaveBeenNthCalledWith(
      2,
      `${API_URL}/api/user/preferences`,
      {
        dietPreference: "veg-only",
        sugarPreference: "no-sweets",
      },
      { headers: { token: "test-token" } }
    );

    expect(toast.success).toHaveBeenCalledWith("Preferences updated");
  });

  it("shows error toast when saving preferences fails", async () => {
    // 1st call -> profile
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          name: "Charlie",
          dietPreference: "any",
          sugarPreference: "any",
        },
      },
    });

    // 2nd call -> preferences (failure)
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Update failed" },
    });

    renderWithStore({ url: API_URL, token: "test-token" });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Charlie")).toBeInTheDocument();
    });

    // Trigger submit without changing anything
    fireEvent.click(
      screen.getByRole("button", { name: /save preferences/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Update failed"
      );
    });
  });

  it("shows error toast if saving preferences throws", async () => {
    // 1st call -> profile
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          name: "Dana",
          dietPreference: "any",
          sugarPreference: "any",
        },
      },
    });

    // 2nd call -> preferences throws
    axios.post.mockRejectedValueOnce(new Error("Server down"));

    renderWithStore({ url: API_URL, token: "test-token" });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Dana")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: /save preferences/i })
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update preferences"
      );
    });
  });
});
