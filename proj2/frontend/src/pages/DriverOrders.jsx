import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../Context/StoreContext";
import toast from "react-hot-toast";

const DriverOrders = () => {
  const { url, token, currency } = useContext(StoreContext);

  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("available"); // "available" | "mine"

  const authHeader = token ? { headers: { token } } : {};

  const fetchAvailableOrders = async () => {
    try {
      const res = await axios.get(`${url}/api/order/driver/available`);
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
      const res = await axios.get(
        `${url}/api/order/driver/my`,
        authHeader
      );
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

        // Remove from available list
        setAvailableOrders((prev) =>
          prev.filter((o) => o._id !== orderId)
        );

        // Add to "My orders"
        setMyOrders((prev) => [claimedOrder, ...prev]);
      } else {
        toast.error(res.data.message || "Could not claim order");
      }
    } catch (err) {
      console.error("Error claiming order", err);
      toast.error("Something went wrong while claiming the order");
    }
  };

  const renderOrderList = (orders, showClaimButton = false) => {
    if (!orders || orders.length === 0) {
      return <p>No orders found.</p>;
    }

    return (
      <ul className="driver-order-list">
        {orders.map((o) => (
          <li key={o._id} className="driver-order-card">
            <div>
              <p>
                <strong>Order ID:</strong> {o._id}
              </p>
              {typeof o.amount === "number" && (
                <p>
                  <strong>Total:</strong>{" "}
                  {currency}
                  {o.amount}
                </p>
              )}
              {o.address && (
                <p>
                  <strong>Address:</strong>{" "}
                  {o.address.formatted ||
                    o.address.line1 ||
                    o.address.fullName ||
                    o.address.name}
                </p>
              )}

              {Array.isArray(o.items) && o.items.length > 0 && (
                <div>
                  <strong>Items:</strong>
                  <ul>
                    {o.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} x{item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p>
                <strong>Status:</strong> {o.status}
              </p>
              {o.driverName && (
                <p>
                  <strong>Driver:</strong> {o.driverName}
                </p>
              )}
            </div>

            {showClaimButton && (
              <button
                className="claim-order-btn"
                onClick={() => handleClaim(o._id)}
              >
                Claim this order
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="driver-orders-page">
      <h2>Driver Dashboard</h2>

      <div className="driver-tabs">
        <button
          className={activeTab === "available" ? "active" : ""}
          onClick={() => setActiveTab("available")}
        >
          Available orders
        </button>
        <button
          className={activeTab === "mine" ? "active" : ""}
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
