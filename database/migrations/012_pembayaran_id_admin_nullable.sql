-- Pembayaran diajukan buyer sebelum admin menvalidasi (id_admin diisi saat validasi).
ALTER TABLE pembayaran
  MODIFY id_admin INT UNSIGNED NULL;
