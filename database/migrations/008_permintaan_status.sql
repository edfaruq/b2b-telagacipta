-- Kolom status permintaan penawaran (Request Quotation dari buyer).
ALTER TABLE permintaan
  ADD COLUMN status_permintaan ENUM('menunggu', 'diproses', 'disetujui', 'ditolak')
    NOT NULL DEFAULT 'menunggu'
  AFTER alamat_tujuan;
