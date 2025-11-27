import { useState, useContext } from "react";
import axios from "axios";
import { StoreContext } from "../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const DriverLogin = () => {
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${url}/api/user/login-driver`, form);
      if (res.data.success) {
        // If you have a global token in StoreContext, you can save it here:
        // const { setToken } = useContext(StoreContext);
        // setToken(res.data.token);

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

  return (
    <div className="driver-auth-page" style={{ padding: "2rem" }}>
      <h2>Driver Login</h2>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
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
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          required
        />
        <button type="submit">Login as Driver</button>
      </form>
    </div>
  );
};

export default DriverLogin;
