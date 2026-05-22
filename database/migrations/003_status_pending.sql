ALTER TABLE pelanggan
  MODIFY COLUMN status_registrasi ENUM('valid', 'tidak_valid', 'pending') NOT NULL DEFAULT 'valid';

UPDATE pelanggan
SET status_registrasi = 'pending'
WHERE status_registrasi = 'tidak_valid';

ALTER TABLE pelanggan
  MODIFY COLUMN status_registrasi ENUM('pending', 'valid') NOT NULL DEFAULT 'pending';
