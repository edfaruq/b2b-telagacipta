ALTER TABLE pelanggan
  MODIFY COLUMN status_registrasi ENUM('pending', 'valid', 'rejected') NOT NULL DEFAULT 'pending';
