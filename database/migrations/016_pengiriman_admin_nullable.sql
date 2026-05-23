-- Auto-created shipments may have no admin yet; track buyer receipt time.
ALTER TABLE pengiriman
  MODIFY id_admin INT UNSIGNED NULL,
  ADD COLUMN tanggal_diterima DATETIME NULL AFTER tanggal_pengiriman;
