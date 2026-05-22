UPDATE pelanggan
SET
  nama = LEFT(nama, 60),
  instansi = LEFT(instansi, 25),
  email = LEFT(email, 50),
  alamat = LEFT(alamat, 100),
  no_telepon = LEFT(REGEXP_REPLACE(no_telepon, '[^0-9]', ''), 15);

ALTER TABLE pelanggan
  MODIFY COLUMN nama VARCHAR(60) NOT NULL,
  MODIFY COLUMN instansi VARCHAR(25) NOT NULL,
  MODIFY COLUMN email VARCHAR(50) NOT NULL,
  MODIFY COLUMN no_telepon BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN alamat VARCHAR(100) NOT NULL;
