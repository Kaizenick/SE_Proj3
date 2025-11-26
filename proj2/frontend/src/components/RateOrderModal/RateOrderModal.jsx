import { useContext, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../Context/StoreContext";
import { toast } from "react-hot-toast";
import "./RateOrderModal.css";

const RateOrderModal = ({ order, onClose, onRated }) => {
  const { url, token } = useContext(StoreContext);

  const [rating, setRating] = useState(order.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState(order.feedback || "");
  const [submitting, setSubmitting] = useState(false);

  const current = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${url}/api/order/rate`,
        {
          orderId: order._id,
          rating,
          feedback,
        },
        {
          headers: { token },
        }
      );

      if (res.data.success) {
        toast.success("Thanks for your feedback!");
        if (onRated) {
          onRated(res.data.data);
        }
      } else {
        toast.error(res.data.message || "Could not submit rating");
      }
    } catch (err) {
      console.error("rate error:", err);
      toast.error(
        err.response?.data?.message || "Something went wrong while rating"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rate-modal-backdrop">
      <div className="rate-modal">
        <button
          className="rate-modal-close"
          onClick={onClose}
          disabled={submitting}
          type="button"
        >
          ×
        </button>

        <h2 className="rate-modal-title">Rate your order</h2>
        <p className="rate-modal-info">
          {order.items?.map((it) => it.name).join(", ")}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="rate-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className="rate-star"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                {current >= star ? "★" : "☆"}
              </span>
            ))}
          </div>

          <textarea
            className="rate-textarea"
            placeholder="Optional feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={500}
          />

          <button
            className="rate-submit-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit rating"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RateOrderModal;
