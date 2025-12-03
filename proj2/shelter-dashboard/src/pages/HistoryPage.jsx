import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function HistoryPage() {
  const { token } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    axios
      .get(`${BACKEND_URL}/api/shelter/donations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // API must return: { donations: [] }
        setDonations(res.data?.donations || []);
      })
      .catch((err) => {
        console.error("History error:", err);
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p>Loading history…</p>;

  return (
    <>
      <h2 className="page-title">Order History</h2>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Items</th>
              <th>Total Value</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {donations.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                  No donation history yet.
                </td>
              </tr>
            ) : (
              donations.map((d) => (
                <tr key={d._id}>
                  <td>
                    {d.createdAt
                      ? new Date(d.createdAt).toLocaleString()
                      : "—"}
                  </td>
                  <td>{d.items?.length || 0}</td>
                  <td>${(d.total || 0).toFixed(2)}</td>
                  <td>{d.status || "Completed"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
