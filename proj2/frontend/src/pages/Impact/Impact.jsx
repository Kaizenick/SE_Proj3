import React, { useContext, useEffect, useState } from "react";
import "./Impact.css";
import axios from "axios";
import { StoreContext } from "../../Context/StoreContext";

const Impact = () => {
  const { url, token } = useContext(StoreContext);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchImpact = async () => {
    try {
      const res = await axios.get(url + "/api/order/impact", {
        headers: { token },
      });
      setImpact(res.data);
    } catch (err) {
      console.error("Impact error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImpact();
  }, []);

  if (loading) {
    return <div className="impact-loading">Loading impact…</div>;
  }

  if (!impact || !impact.success) {
    return (
      <div className="impact-error">
        Unable to load impact data. Try again later.
      </div>
    );
  }

  const pendingCount = impact.totalPendingOrders || 0;
  const donatedCount = impact.totalDonatedOrders || 0;
  const pendingOrders = impact.pendingOrders || [];
  const donatedOrders = impact.donatedOrders || [];

  return (
    <div className="impact-container">
      <h1>My Impact</h1>

      <div className="impact-summary">
        <div className="impact-card pending">
          <h2>Waiting to be donated</h2>
          <p className="impact-number">{pendingCount}</p>
          <p className="impact-label">
            {pendingCount === 1
              ? "order currently queued for donation"
              : "orders currently queued for donation"}
          </p>
        </div>

        <div className="impact-card donated">
          <h2>Already donated</h2>
          <p className="impact-number">{donatedCount}</p>
          <p className="impact-label">
            {donatedCount === 1
              ? "order that helped feed people"
              : "orders that helped feed people"}
          </p>
        </div>
      </div>

      <div className="impact-lists">
        <div className="impact-list-column">
          <h3>Cancelled, yet to be donated</h3>
          {pendingOrders.length === 0 ? (
            <p className="impact-empty">No pending donations right now.</p>
          ) : (
            <ul className="impact-order-list">
              {pendingOrders.map((o) => (
                <li key={o._id} className="impact-order-item">
                  <span>Order: {o._id.slice(-6)}</span>
                  {o.amount && <span>${o.amount.toFixed(2)}</span>}
                  <span className="impact-pill">Redistribute</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="impact-list-column">
          <h3>Donated orders</h3>
          {donatedOrders.length === 0 ? (
            <p className="impact-empty">No donated orders yet.</p>
          ) : (
            <ul className="impact-order-list">
              {donatedOrders.map((o) => (
                <li key={o._id} className="impact-order-item">
                  <span>Order: {o._id.slice(-6)}</span>
                  {o.amount && <span>${o.amount.toFixed(2)}</span>}
                  <span className="impact-pill donated-pill">Donated</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Impact;
