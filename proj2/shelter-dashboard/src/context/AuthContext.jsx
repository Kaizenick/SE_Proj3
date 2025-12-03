import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();   //navigation hook

  const [token, setToken] = useState(null);
  const [shelter, setShelter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("shelterToken");
    if (stored) {
      setToken(stored);
      fetchProfile(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (jwt) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/shelter/me`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.data?.success) {
        setShelter(res.data.shelter);
      }
    } catch (e) {
      console.error("Failed to fetch shelter profile", e);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${BACKEND_URL}/api/shelter/login`, {
      email,
      password
    });

    if (!res.data?.success || !res.data.token) {
      throw new Error(res.data?.message || "Login failed");
    }

    localStorage.setItem("shelterToken", res.data.token);
    setToken(res.data.token);
    setShelter(res.data.shelter);

    navigate("/dashboard");   // redirect user to dashboard
  };

  const logout = () => {
    localStorage.removeItem("shelterToken");
    setToken(null);
    setShelter(null);
    navigate("/login");       // also redirect after logout
  };

  const value = {
    token,
    shelter,
    loading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
