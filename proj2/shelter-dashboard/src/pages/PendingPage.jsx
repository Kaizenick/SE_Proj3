import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function PendingPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${BACKEND_URL}/api/shelter/pending-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data?.orders || []))
      .catch((err) => console.error("Pending orders error:", err))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (id) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/shelter/orders/${id}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error("Error accepting order", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/shelter/orders/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      console.error("Error rejecting order", err);
    }
  };

  if (loading) return <p>Loading pending orders…</p>;

  return (
    <>
      <h2 className="page-title">Pending Orders</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>
                  No pending orders.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o._id}>
                  <td>{o._id}</td>
                  <td>{o.items?.length || 0}</td>
                  <td>
                    <button
                      className="btn-small"
                      style={{
                        background: "#ff7e00",
                        color: "white",
                        marginRight: "10px",
                        padding: "8px 14px",
                        borderRadius: "6px",
                      }}
                      onClick={() => handleAccept(o._id)}
                    >
                      Accept
                    </button>

                    <button
                      className="btn-small secondary"
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                      }}
                      onClick={() => handleReject(o._id)}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
