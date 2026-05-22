-- Kolom tambahan untuk form admin Create Product & homepage flags
ALTER TABLE produk
  ADD COLUMN deskripsi_singkat VARCHAR(100) NOT NULL DEFAULT '' AFTER nama_produk,
  ADD COLUMN foto_produk VARCHAR(255) NOT NULL DEFAULT '' AFTER deskripsi,
  ADD COLUMN is_latest TINYINT(1) NOT NULL DEFAULT 0 AFTER foto_produk,
  ADD COLUMN is_favorite TINYINT(1) NOT NULL DEFAULT 0 AFTER is_latest,
  ADD COLUMN status ENUM('active', 'draft') NOT NULL DEFAULT 'active' AFTER is_favorite;
