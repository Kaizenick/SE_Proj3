import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../Context/StoreContext";
import toast from "react-hot-toast";
import "../styles/driver.css";

const DriverOrders = () => {
  const { url, token, currency } = useContext(StoreContext);

  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("available"); // "available" | "mine"

  const authHeader = token ? { headers: { token } } : {};

  const fetchAvailableOrders = async () => {
    if (!token) return;
    try {
      const res = await axios.get(
        `${url}/api/order/driver/available`,
        authHeader
      );
      if (res.data.success) {
        setAvailableOrders(res.data.data || []);
      } else {
        console.error(res.data.message || "Failed to fetch available orders");
      }
    } catch (err) {
      console.error("Error fetching available orders", err);
    }
  };

  const fetchMyOrders = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${url}/api/order/driver/my`, authHeader);
      if (res.data.success) {
        setMyOrders(res.data.data || []);
      } else {
        console.error(res.data.message || "Failed to fetch driver orders");
      }
    } catch (err) {
      console.error("Error fetching driver orders", err);
    }
  };

  useEffect(() => {
    fetchAvailableOrders();
    fetchMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleClaim = async (orderId) => {
    if (!token) {
      toast.error("Please login as a driver first");
      return;
    }
    try {
      const res = await axios.post(
        `${url}/api/order/driver/claim`,
        { orderId },
        authHeader
      );

      if (res.data.success) {
        toast.success("Order claimed!");

        const claimedOrder = res.data.data;
        setAvailableOrders((prev) => prev.filter((o) => o._id !== orderId));
        setMyOrders((prev) => [claimedOrder, ...prev]);
      } else {
        toast.error(res.data.message || "Could not claim order");
      }
    } catch (err) {
      console.error("Error claiming order", err);
      toast.error("Something went wrong while claiming the order");
    }
  };

  // Map backend status string to CSS class
  const getStatusClass = (statusRaw) => {
    const status = (statusRaw || "").toLowerCase();
    if (status.includes("driver assigned")) return "driver-assigned";
    if (status.includes("out for delivery")) return "out-for-delivery";
    if (status.includes("delivered")) return "delivered";
    if (status.includes("redistribute")) return "redistribute";
    if (status.includes("cancelled")) return "cancelled";
    if (status.includes("donated")) return "donated";
    return "processing";
  };

  const renderOrderList = (orders, showClaimButton = false) => {
    if (!orders || orders.length === 0) {
      return <p>No orders found in this list.</p>;
    }

    return (
      <ul className="driver-order-list">
        {orders.map((o) => (
          <li key={o._id} className="driver-order-card">
            <div>
              <div className="driver-order-header">
                <div>
                  <div className="driver-order-id">
                    <strong>Order:</strong> {o._id}
                  </div>
                  {typeof o.amount === "number" && (
                    <div className="driver-order-meta">
                      <span>
                        <strong>Total:</strong> {currency}
                        {o.amount}
                      </span>
                    </div>
                  )}
                </div>

                <span
                  className={`driver-status-pill ${getStatusClass(o.status)}`}
                >
                  {o.status || "Food Processing"}
                </span>
              </div>

              <div className="driver-order-meta">
                {o.address && (
                  <span>
                    <strong>Address:</strong>{" "}
                    {o.address.formatted ||
                      o.address.line1 ||
                      o.address.fullName ||
                      o.address.name}
                  </span>
                )}

                {o.driverName && (
                  <span>
                    <strong>Driver:</strong> {o.driverName}
                  </span>
                )}
              </div>

              {Array.isArray(o.items) && o.items.length > 0 && (
                <div>
                  <strong style={{ fontSize: "0.85rem" }}>Items:</strong>
                  <ul className="driver-order-items">
                    {o.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} × {item.quantity || item.qty || 1}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {showClaimButton && (
              <div>
                <button
                  className="claim-order-btn"
                  onClick={() => handleClaim(o._id)}
                >
                  Claim this order
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="driver-page">
      <div className="driver-header">
        <h2>Driver Dashboard</h2>
        <p>
          View delivery opportunities, claim orders, and track the ones assigned
          to you.
        </p>
      </div>

      <div className="driver-tabs">
        <button
          className={`driver-tab-button ${
            activeTab === "available" ? "active" : ""
          }`}
          onClick={() => setActiveTab("available")}
        >
          Available orders
        </button>
        <button
          className={`driver-tab-button ${
            activeTab === "mine" ? "active" : ""
          }`}
          onClick={() => setActiveTab("mine")}
        >
          My orders
        </button>
      </div>

      <div className="driver-tab-content">
        {activeTab === "available"
          ? renderOrderList(availableOrders, true)
          : renderOrderList(myOrders, false)}
      </div>
    </div>
  );
};

export default DriverOrders;
