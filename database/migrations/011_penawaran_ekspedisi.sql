-- Nama perusahaan ekspedisi pada penawaran admin.
ALTER TABLE penawaran
  ADD COLUMN ekspedisi VARCHAR(120) NOT NULL DEFAULT '' AFTER biaya_pengiriman;
