"use client";

import { useState } from "react";
import { StarRatingInput } from "@/components/shared/StarRating";
import { MAX_ORDER_FEEDBACK_LENGTH } from "@/lib/order-feedback";

type Props = {
  invoiceId: number;
  mode: "confirm" | "rate-only";
  onSuccess: (message: string) => void;
};

export function OrderShippingFeedbackForm({ invoiceId, mode, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const rateOnly = mode === "rate-only";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/shipping/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "Could not save your feedback.");
        return;
      }
      onSuccess(data.message ?? "Thank you for your feedback!");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mq-feedback-form" onSubmit={handleSubmit}>
      <p className="mq-feedback-title">
        {rateOnly ? "Rate your order" : "Confirm delivery & rate your order"}
      </p>
      <p className="mq-feedback-prompt">How was your order?</p>
      <StarRatingInput value={rating} onChange={setRating} disabled={submitting} size={28} />

      <label className="mq-feedback-label" htmlFor={`mq-fb-${invoiceId}`}>
        Feedback <span className="mq-feedback-optional">(optional)</span>
      </label>
      <textarea
        id={`mq-fb-${invoiceId}`}
        className="mq-feedback-textarea"
        rows={3}
        maxLength={MAX_ORDER_FEEDBACK_LENGTH}
        placeholder="Product quality, packaging, delivery time…"
        value={feedback}
        disabled={submitting}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <p className="mq-feedback-count">
        {feedback.length}/{MAX_ORDER_FEEDBACK_LENGTH}
      </p>

      {error ? <p className="mq-feedback-error">{error}</p> : null}

      <button type="submit" className="mq-feedback-submit" disabled={submitting}>
        {submitting
          ? "Submitting…"
          : rateOnly
            ? "Submit rating"
            : "Submit & confirm received"}
      </button>
    </form>
  );
}
