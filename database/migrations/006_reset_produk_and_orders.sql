-- Hapus semua produk (dan data permintaan/penawaran yang bergantung) untuk lingkungan testing.
DELETE FROM pembayaran;
DELETE FROM invoice;
DELETE FROM penawaran;
DELETE FROM permintaan;
DELETE FROM produk;
