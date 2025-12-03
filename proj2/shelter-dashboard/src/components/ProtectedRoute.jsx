import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, shelter } = useAuth();

  if (loading) return <p>Loading…</p>;
  if (!isAuthenticated || !shelter) return <Navigate to="/login" replace />;

  return children;
};


export default ProtectedRoute;
