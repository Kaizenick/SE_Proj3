import { useState, useContext } from "react";
import axios from "axios";
import { StoreContext } from "../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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

  return (
    <div className="driver-auth-page" style={{ padding: "2rem" }}>
      <h2>Driver Registration</h2>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={onChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password (min 8 chars)"
          value={form.password}
          onChange={onChange}
          required
        />
        <button type="submit">Register as Driver</button>
      </form>
    </div>
  );
};

export default DriverRegister;
