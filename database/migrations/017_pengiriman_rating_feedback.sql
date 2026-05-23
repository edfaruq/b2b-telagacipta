-- Buyer rating & feedback when confirming delivery
ALTER TABLE pengiriman
  ADD COLUMN rating TINYINT UNSIGNED NULL AFTER tanggal_diterima,
  ADD COLUMN feedback TEXT NULL AFTER rating;
