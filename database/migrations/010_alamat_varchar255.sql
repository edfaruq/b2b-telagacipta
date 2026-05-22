UPDATE pelanggan
SET alamat = LEFT(alamat, 255);

ALTER TABLE pelanggan
  MODIFY COLUMN alamat VARCHAR(255) NOT NULL;
