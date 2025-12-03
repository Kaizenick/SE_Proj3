import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function DashboardPage() {
  const { token, shelter } = useAuth();

  const [totalDonations, setTotalDonations] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadStats = async () => {
      try {
        // Fetch pending orders
        const pendingRes = await axios.get(
          `${BACKEND_URL}/api/shelter/pending-orders`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPendingCount(pendingRes.data.orders?.length || 0);

        // Fetch donation history
        const historyRes = await axios.get(
          `${BACKEND_URL}/api/shelter/donations`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const donations = historyRes.data?.donations || [];

        // Total Donations count
        setTotalDonations(donations.length);

        // Total Value (sum of all donations)
        const total = donations.reduce(
          (sum, d) => sum + Number(d.total || 0),
          0
        );
        setTotalValue(total);
      } catch (err) {
        console.error("Error loading dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token]);

  if (loading) return <p>Loading dashboard…</p>;

  return (
    <div>
      <h2 className="page-title">Welcome, {shelter?.name}</h2>

      {/* Admin-style card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* Total Donations */}
        <div className="admin-card">
          <p className="card-label">Total Donations</p>
          <p className="card-value">{totalDonations}</p>
        </div>

        {/* Total Value */}
        <div className="admin-card">
          <p className="card-label">Total Value</p>
          <p className="card-value">${totalValue.toFixed(2)}</p>
        </div>

        {/* Pending Orders */}
        <div className="admin-card">
          <p className="card-label">Pending Orders</p>
          <p className="card-value">{pendingCount}</p>
        </div>
      </div>
    </div>
  );
}
