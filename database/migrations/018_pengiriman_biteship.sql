-- Biteship integration fields on pengiriman
ALTER TABLE pengiriman
  ADD COLUMN biteship_order_id VARCHAR(64) NULL AFTER nomor_resi,
  ADD COLUMN biteship_courier_code VARCHAR(40) NULL AFTER biteship_order_id,
  ADD COLUMN biteship_courier_type VARCHAR(40) NULL AFTER biteship_courier_code;
