import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../Context/StoreContext";

const DriverOrders = () => {
  const { url } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${url}/api/order/driver/available`);
      if (res.data.success) {
        setOrders(res.data.data || []);
      } else {
        console.error(res.data.message || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching driver orders", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="driver-orders-page" style={{ padding: "2rem" }}>
      <h2>Available Orders</h2>

      {orders.length === 0 && <p>No orders yet.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {orders.map((o) => (
          <li
            key={o._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <p>
              <strong>Order ID:</strong> {o._id}
            </p>
            <p>
              <strong>Amount:</strong> ${o.amount}
            </p>
            {o.address && (
              <p>
                <strong>Address:</strong>{" "}
                {o.address.formatted ||
                  o.address.street ||
                  o.address.name ||
                  `${o.address.firstName || ""} ${
                    o.address.lastName || ""
                  }`.trim()}
              </p>
            )}
            {Array.isArray(o.items) && o.items.length > 0 && (
              <div>
                <strong>Items:</strong>
                <ul>
                  {o.items.map((item, idx) => (
                    <li key={idx}>
                      {item.name} × {item.quantity ?? 1} (${item.price})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p>
              <strong>Status:</strong> {o.status}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DriverOrders;
