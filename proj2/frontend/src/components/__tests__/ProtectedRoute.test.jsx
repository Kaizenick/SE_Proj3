import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../ProtectedRoute.jsx";
import { StoreContext } from "../../Context/StoreContext.jsx";


const renderWithStoreAndRouter = ({ token }) => {
  return render(
    <StoreContext.Provider value={{ token }}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          {/* Protected route uses ProtectedRoute as a wrapper around children */}
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />

          {/* This is where ProtectedRoute redirects when there is no token */}
          <Route
            path="/driver/register"
            element={<div>Driver Register Page</div>}
          />
        </Routes>
      </MemoryRouter>
    </StoreContext.Provider>
  );
};

describe("ProtectedRoute", () => {
  it("renders protected content when user has a token", () => {
    renderWithStoreAndRouter({ token: "abc123" });

    // Should see protected content, NOT the driver register page
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Driver Register Page")).toBeNull();
  });

  it("redirects to /driver/register when user has no token", () => {
    renderWithStoreAndRouter({ token: "" });

    // Should see the driver register page, NOT protected content
    expect(screen.getByText("Driver Register Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).toBeNull();
  });
});
