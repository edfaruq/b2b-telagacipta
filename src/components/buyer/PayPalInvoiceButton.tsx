"use client";

import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
const paypalCurrency = (
  process.env.NEXT_PUBLIC_PAYPAL_CURRENCY ??
  process.env.PAYPAL_CURRENCY ??
  "USD"
)
  .trim()
  .toUpperCase();
const currency = paypalCurrency === "IDR" ? "IDR" : "USD";

type Props = {
  invoiceId: number;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  onSuccess: (payload: { transactionId: string; receiptNumber?: string }) => void;
  onError: (message: string) => void;
};

export function PayPalInvoiceButton({
  invoiceId,
  disabled = false,
  onBusyChange,
  onSuccess,
  onError,
}: Props) {
  const [statusMessage, setStatusMessage] = useState("");

  if (!clientId) {
    return (
      <p className="pay-paypal-unavailable">
        PayPal is not configured (missing NEXT_PUBLIC_PAYPAL_CLIENT_ID).
      </p>
    );
  }

  const setBusy = (busy: boolean) => {
    onBusyChange?.(busy);
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency,
        intent: "capture",
        components: "buttons",
      }}
    >
      <div className={`pay-paypal-wrap${disabled ? " pay-paypal-wrap--disabled" : ""}`}>
        {statusMessage ? <p className="pay-paypal-status">{statusMessage}</p> : null}
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          disabled={disabled}
          createOrder={async () => {
            setStatusMessage("Creating PayPal order…");
            setBusy(true);
            onError("");
            try {
              const res = await fetch(`/api/invoices/${invoiceId}/paypal/create-order`, {
                method: "POST",
              });
              const data = (await res.json()) as { orderId?: string; message?: string };
              if (!res.ok || !data.orderId) {
                throw new Error(data.message ?? "Could not create PayPal order.");
              }
              setStatusMessage("");
              return data.orderId;
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Could not create PayPal order.";
              onError(msg);
              setStatusMessage("");
              throw err;
            } finally {
              setBusy(false);
            }
          }}
          onApprove={async (data) => {
            setStatusMessage("Confirming payment…");
            setBusy(true);
            onError("");
            try {
              const res = await fetch(`/api/invoices/${invoiceId}/paypal/capture`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID }),
              });
              const body = (await res.json()) as {
                message?: string;
                transactionId?: string;
                receiptNumber?: string;
              };
              if (!res.ok) {
                throw new Error(body.message ?? "PayPal payment could not be completed.");
              }
              setStatusMessage("");
              onSuccess({
                transactionId: body.transactionId ?? data.orderID,
                receiptNumber: body.receiptNumber,
              });
            } catch (err) {
              const msg =
                err instanceof Error ? err.message : "PayPal payment could not be completed.";
              onError(msg);
              setStatusMessage("");
            } finally {
              setBusy(false);
            }
          }}
          onCancel={() => {
            setStatusMessage("");
            setBusy(false);
          }}
          onError={(err) => {
            console.error("[PayPal]", err);
            onError("PayPal checkout was interrupted or failed. Please try again.");
            setStatusMessage("");
            setBusy(false);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
