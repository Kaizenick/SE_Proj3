import { useState, useContext } from "react";
import axios from "axios";
import { StoreContext } from "../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/driver.css";

const DriverLogin = () => {
  const { url, setToken } = useContext(StoreContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${url}/api/user/login-driver`, form);
      if (res.data.success) {
        const token = res.data.token;
        setToken(token);
        localStorage.setItem("token", token);

        toast.success("Driver login successful");
        navigate("/driver/orders");
      } else {
        toast.error(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const goToRegister = () => {
    navigate("/driver/register");
  };

  return (
    <div className="driver-auth-wrapper">
      <div className="driver-auth-card">
        <div className="driver-auth-header">
          <h2 className="driver-auth-title">Driver Login</h2>
          <p className="driver-auth-subtitle">
            Log in to view delivery opportunities and manage your active orders.
          </p>
        </div>

        <form className="driver-auth-form" onSubmit={onSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={onChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            required
          />

          <button type="submit" className="driver-primary-btn">
            Login as Driver
          </button>
        </form>

        <div className="driver-auth-actions">
          <span className="driver-auth-note">
            Don&apos;t have a driver account yet?
          </span>
          <button
            type="button"
            className="driver-secondary-btn"
            onClick={goToRegister}
          >
            Register as Driver
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverLogin;
