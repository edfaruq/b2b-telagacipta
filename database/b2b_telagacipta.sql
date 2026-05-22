CREATE DATABASE IF NOT EXISTS b2b_telagacipta
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE b2b_telagacipta;

CREATE TABLE IF NOT EXISTS pelanggan (
  id_pelanggan INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(60) NOT NULL,
  instansi VARCHAR(50) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  no_telepon BIGINT UNSIGNED NOT NULL,
  alamat VARCHAR(255) NOT NULL,
  negara VARCHAR(80) NOT NULL,
  status_registrasi ENUM('pending', 'valid', 'rejected') NOT NULL DEFAULT 'pending',
  tanggal_registrasi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin (
  id_admin INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS produk (
  id_produk INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama_produk VARCHAR(150) NOT NULL,
  deskripsi TEXT NOT NULL,
  harga_indikatif DECIMAL(12,2) NOT NULL,
  satuan VARCHAR(20) NOT NULL,
  stok INT UNSIGNED NOT NULL DEFAULT 0,
  asal_produk VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permintaan (
  id_permintaan INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_pelanggan INT UNSIGNED NOT NULL,
  id_produk INT UNSIGNED NOT NULL,
  jumlah_permintaan DECIMAL(12,2) NOT NULL,
  detail_permintaan TEXT NULL,
  alamat_tujuan TEXT NOT NULL,
  status_permintaan ENUM('menunggu', 'diproses', 'disetujui', 'ditolak') NOT NULL DEFAULT 'menunggu',
  tanggal_permintaan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_permintaan_pelanggan FOREIGN KEY (id_pelanggan) REFERENCES pelanggan (id_pelanggan),
  CONSTRAINT fk_permintaan_produk FOREIGN KEY (id_produk) REFERENCES produk (id_produk)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS penawaran (
  id_penawaran INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_permintaan INT UNSIGNED NOT NULL,
  id_admin INT UNSIGNED NOT NULL,
  harga_ton DECIMAL(12,2) NOT NULL,
  biaya_pengiriman DECIMAL(12,2) NOT NULL,
  ekspedisi VARCHAR(120) NOT NULL DEFAULT '',
  total_penawaran DECIMAL(12,2) NOT NULL,
  tanggal_penawaran DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status_penawaran ENUM('draft', 'dikirim', 'disetujui', 'ditolak') NOT NULL DEFAULT 'dikirim',
  CONSTRAINT fk_penawaran_permintaan FOREIGN KEY (id_permintaan) REFERENCES permintaan (id_permintaan),
  CONSTRAINT fk_penawaran_admin FOREIGN KEY (id_admin) REFERENCES admin (id_admin)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoice (
  id_invoice INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_penawaran INT UNSIGNED NOT NULL UNIQUE,
  nomor_invoice VARCHAR(60) NOT NULL UNIQUE,
  tanggal_invoice DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_invoice DECIMAL(12,2) NOT NULL,
  status_invoice ENUM('belum_bayar', 'lunas', 'dibatalkan') NOT NULL DEFAULT 'belum_bayar',
  CONSTRAINT fk_invoice_penawaran FOREIGN KEY (id_penawaran) REFERENCES penawaran (id_penawaran)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pembayaran (
  id_pembayaran INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_invoice INT UNSIGNED NOT NULL UNIQUE,
  id_admin INT UNSIGNED NULL,
  tanggal_pembayaran DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bukti_pembayaran VARCHAR(255) NULL,
  status_pembayaran ENUM('menunggu_validasi', 'valid', 'ditolak') NOT NULL DEFAULT 'menunggu_validasi',
  nomor_receipt VARCHAR(60) NULL UNIQUE,
  tanggal_validasi DATETIME NULL,
  catatan_validasi TEXT NULL,
  CONSTRAINT fk_pembayaran_invoice FOREIGN KEY (id_invoice) REFERENCES invoice (id_invoice),
  CONSTRAINT fk_pembayaran_admin FOREIGN KEY (id_admin) REFERENCES admin (id_admin)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pengiriman (
  id_pengiriman INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_invoice INT UNSIGNED NOT NULL UNIQUE,
  id_admin INT UNSIGNED NOT NULL,
  tanggal_pengiriman DATETIME NULL,
  status_pengiriman ENUM('diproses', 'dikirim', 'diterima') NOT NULL DEFAULT 'diproses',
  nomor_resi VARCHAR(100) NULL,
  CONSTRAINT fk_pengiriman_invoice FOREIGN KEY (id_invoice) REFERENCES invoice (id_invoice),
  CONSTRAINT fk_pengiriman_admin FOREIGN KEY (id_admin) REFERENCES admin (id_admin)
) ENGINE=InnoDB;

INSERT INTO admin (email, password)
VALUES
  ('admin@telagacipta.com', 'Admin@123')
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO pelanggan (nama, instansi, email, password, no_telepon, alamat, negara, status_registrasi)
VALUES
  ('Budi Santoso', 'PT Rempah Jaya', 'budi@rempahjaya.co.id', 'Buyer@123', 6281211111111, 'Jl. Sudirman No. 18, Jakarta', 'Indonesia', 'valid'),
  ('Sarah Wijaya', 'Nusantara Herbs Pte', 'sarah@nusantaraherbs.sg', 'Buyer@123', 6581234567, '10 Anson Road, Singapore', 'Singapore', 'valid')
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO produk (nama_produk, deskripsi, harga_indikatif, satuan, stok, asal_produk)
VALUES
  ('Giant Ginger', 'Selected fresh rhizomes for seasoning and herbal beverages.', 18600.00, 'kg', 90, 'Central Java'),
  ('Dried Cloves', 'Export-grade cloves with strong aroma for food industry needs.', 20000.00, 'kg', 70, 'Maluku'),
  ('Black Pepper', 'Premium black peppercorns with a bold and distinctive taste.', 100000.00, 'kg', 35, 'Lampung')
ON DUPLICATE KEY UPDATE nama_produk = VALUES(nama_produk);
