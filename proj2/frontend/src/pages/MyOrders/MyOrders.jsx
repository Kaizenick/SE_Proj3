import React, { useContext, useEffect, useState, useRef } from "react";
import "./MyOrders.css";
import axios from "axios";
import { StoreContext } from "../../Context/StoreContext";
import { assets } from "../../assets/assets";
import { useSocket } from "../../Context/SocketContext";
import RateOrderModal from "../../components/RateOrderModal/RateOrderModal";

const MyOrders = () => {
  const [data, setData] = useState([]);
  const { url, token, currency } = useContext(StoreContext);
  const socket = useSocket();
  const orderRefreshHandlerRef = useRef(null);

  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // (Optional) Decode token to get userId, but we don't actually need it
  // for cancel logic because this page already fetches only the
  // logged-in user's orders from the backend.
  const getUserId = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch (error) {
      return null;
    }
  };

  const currentUserId = getUserId();

  const fetchOrders = async () => {
    try {
      const response = await axios.post(
        url + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      setData(response.data.data || []);
    } catch (err) {
      console.error("Error fetching user orders", err);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.post(
        url + "/api/order/cancel_order",
        { orderId },
        { headers: { token } }
      );

      if (response.data.success) {
        fetchOrders();
      } else {
        alert(response.data.message || "Failed to cancel order");
      }
    } catch (error) {
      console.log(error);
      alert("Error cancelling order");
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // Listen for order cancellations to refresh the list
  useEffect(() => {
    if (socket) {
      orderRefreshHandlerRef.current = () => {
        console.log("📋 MyOrders: Refreshing orders due to cancellation");
        fetchOrders();
      };

      socket.on("orderCancelled", orderRefreshHandlerRef.current);

      return () => {
        if (orderRefreshHandlerRef.current) {
          socket.off("orderCancelled", orderRefreshHandlerRef.current);
        }
      };
    }
  }, [socket]);

  // Old progress-bar logic removed / commented out
  // const calculateProgress = (createdAt) => { ... }
  // const [, forceUpdate] = useState();
  // useEffect(() => { ... }, []);

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order, index) => {
          const isDeliveredStatus = order.status === "Delivered";
          const isDonatedStatus = order.status === "Donated";
          const isRedistributedStatus = order.status === "Redistribute";
          const isCancelled = order.status === "Cancelled";

          // Normalize status to be safe against case/whitespace differences
          const normalizeStatus = (s) => (s || "").toLowerCase().trim();

          // User can cancel ONLY when driver has NOT claimed it
          // and status is either "Food Preparing" or "Looking for driver"
          const userCancellableStatuses = ["food preparing", "looking for driver"];

          const canUserCancel =
            userCancellableStatuses.includes(normalizeStatus(order.status)) &&
            !isDeliveredStatus &&
            !isDonatedStatus &&
            !isRedistributedStatus &&
            !isCancelled;


          // 🔹 price & discount logic
          const rawAmount =
            typeof order.amount === "number" ? order.amount : 0;

          const originalAmount =
            typeof order.originalAmount === "number"
              ? order.originalAmount
              : rawAmount;

          // claimed order = current owner != original user
          const isClaimedOrder =
            order.originalUserId &&
            order.originalUserId.toString() !== order.userId.toString();

          // For claimed orders in our UX, the claimer pays nothing
          const displayPaid = isClaimedOrder ? 0 : rawAmount;

          const hasDiscount = originalAmount > displayPaid;
          const savings = hasDiscount
            ? Math.max(originalAmount - displayPaid, 0)
            : 0;

          return (
            <div
              key={index}
              className={`my-orders-order ${
                isCancelled ? "cancelled-order" : ""
              }`}
            >
              <img src={assets.parcel_icon} alt="" />

              {/* Items list */}
              <p>
                {order.items.map((item, i) => {
                  if (i === order.items.length - 1) {
                    return item.name + " x " + item.quantity;
                  } else {
                    return item.name + " x " + item.quantity + ", ";
                  }
                })}
              </p>

              {/* 💰 PRICE COLUMN */}
              <p className="order-price-cell">
                {hasDiscount ? (
                  <>
                    <span className="price-original">
                      Original:{" "}
                      <span className="price-original-value">
                        {currency}
                        {originalAmount.toFixed(2)}
                      </span>
                    </span>

                    <span className="price-paid">
                      {isClaimedOrder ? "You got it for: " : "You paid: "}
                      <strong>
                        {isClaimedOrder
                          ? "FREE"
                          : `${currency}${displayPaid.toFixed(2)}`}
                      </strong>
                    </span>

                    <span className="price-saved">
                      You saved{" "}
                      <strong>
                        {currency}
                        {savings.toFixed(2)}
                      </strong>
                    </span>
                  </>
                ) : (
                  <span className="price-main">
                    {isClaimedOrder
                      ? "FREE"
                      : `${currency}${displayPaid.toFixed(2)}`}
                  </span>
                )}
              </p>

              <p>Items: {order.items.length}</p>

              {/* Simple status line instead of progress bar */}
              <p
                className={`order-status-text ${
                  isDeliveredStatus
                    ? "status-delivered"
                    : isDonatedStatus
                    ? "status-donated"
                    : isRedistributedStatus
                    ? "status-redistributed"
                    : isCancelled
                    ? "status-cancelled"
                    : ""
                }`}
              >
                Status:&nbsp;
                {isRedistributedStatus
                  ? "Redistributed"
                  : isDonatedStatus
                  ? "Donated to shelter"
                  : order.status || "Unknown"}
              </p>

              {/* Claimed order badge */}
              {isClaimedOrder && !isCancelled && (
                <p className="claimed-badge">Claimed order</p>
              )}

              {/* Rating UI for delivered orders */}
              {!isCancelled && isDeliveredStatus && !order.rating && (
                <button
                  className="rate-order-btn"
                  onClick={() => {
                    setSelectedOrderForRating(order);
                    setShowRatingModal(true);
                  }}
                >
                  Rate order
                </button>
              )}

              {!isCancelled && isDeliveredStatus && order.rating && (
                <div className="order-rating-display">
                  <span className="order-rating-stars">
                    {"★".repeat(order.rating).padEnd(5, "☆")}
                  </span>
                  {order.feedback && (
                    <p className="order-rating-feedback">
                      “{order.feedback}”
                    </p>
                  )}
                </div>
              )}

              {/* Cancel button logic */}
              {canUserCancel ? (
                <button
                  onClick={() => cancelOrder(order._id)}
                  className="cancel-order-btn"
                >
                  Cancel order
                </button>
              ) : (
                <button
                  className="cancel-order-btn"
                  disabled
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                >
                  {isRedistributedStatus
                    ? "Redistributed"
                    : isCancelled
                    ? "Cancelled"
                    : "Cannot cancel"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showRatingModal && selectedOrderForRating && (
        <RateOrderModal
          order={selectedOrderForRating}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedOrderForRating(null);
          }}
          onRated={(updatedOrder) => {
            setData((prev) =>
              prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
            );
            setShowRatingModal(false);
            setSelectedOrderForRating(null);
          }}
        />
      )}
    </div>
  );
};

export default MyOrders;
