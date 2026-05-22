-- Nomor receipt & tanggal validasi (diisi saat admin approve pembayaran).
ALTER TABLE pembayaran
  ADD COLUMN nomor_receipt VARCHAR(60) NULL UNIQUE AFTER status_pembayaran,
  ADD COLUMN tanggal_validasi DATETIME NULL AFTER nomor_receipt;
