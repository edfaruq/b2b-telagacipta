UPDATE pelanggan
SET instansi = LEFT(instansi, 50);

ALTER TABLE pelanggan
  MODIFY COLUMN instansi VARCHAR(50) NOT NULL;
