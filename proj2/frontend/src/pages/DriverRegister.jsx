import { useState, useContext } from "react";
import axios from "axios";
import { StoreContext } from "../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../styles/driver.css";

const DriverRegister = () => {
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${url}/api/user/register-driver`, form);
      if (res.data.success) {
        toast.success("Driver registered, please login.");
        navigate("/driver/login");
      } else {
        toast.error(res.data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const goToLogin = () => {
    navigate("/driver/login");
  };

  return (
    <div className="driver-auth-wrapper">
      <div className="driver-auth-card">
        <div className="driver-auth-header">
          <h2 className="driver-auth-title">Driver Registration</h2>
          <p className="driver-auth-subtitle">
            Create a driver account to start accepting delivery requests.
          </p>
        </div>

        <form className="driver-auth-form" onSubmit={onSubmit}>
          <input
            name="name"
            type="text"
            placeholder="Full name"
            value={form.name}
            onChange={onChange}
            required
          />
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
            placeholder="Password (min 8 characters)"
            value={form.password}
            onChange={onChange}
            required
          />

          <button type="submit" className="driver-primary-btn">
            Register as Driver
          </button>
        </form>

        <div className="driver-auth-actions">
          <span className="driver-auth-note">
            Already have a driver account?
          </span>
          <button
            type="button"
            className="driver-secondary-btn"
            onClick={goToLogin}
          >
            Login as Driver
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
