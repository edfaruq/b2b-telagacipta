-- PayPal checkout fields (sandbox / production-ready schema).
ALTER TABLE pembayaran
  ADD COLUMN metode_pembayaran ENUM('transfer', 'paypal') NOT NULL DEFAULT 'transfer' AFTER status_pembayaran,
  ADD COLUMN paypal_order_id VARCHAR(40) NULL AFTER metode_pembayaran,
  ADD COLUMN paypal_transaction_id VARCHAR(40) NULL AFTER paypal_order_id;

CREATE INDEX idx_pembayaran_paypal_order ON pembayaran (paypal_order_id);
