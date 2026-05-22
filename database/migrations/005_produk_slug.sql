-- URL-friendly slug untuk halaman /products/[slug]
ALTER TABLE produk
  ADD COLUMN slug VARCHAR(190) NULL AFTER nama_produk;

UPDATE produk SET slug = CONCAT('produk-', id_produk) WHERE slug IS NULL OR slug = '';

ALTER TABLE produk
  MODIFY slug VARCHAR(190) NOT NULL;

ALTER TABLE produk
  ADD UNIQUE KEY ux_produk_slug (slug);
