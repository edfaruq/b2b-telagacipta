# Database Migration (MySQL / Laragon)

## Sekali setup
1. Pastikan `.env.local` sudah diisi:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
2. Jalankan:

```bash
npm run db:migrate
```

Script akan:
- membuat database jika belum ada
- membuat tabel `schema_migrations`
- menjalankan file SQL di `database/migrations` yang belum pernah dijalankan

## Menambah perubahan schema baru
1. Buat file baru di `database/migrations`, contoh:
   - `002_add_logs_table.sql`
2. Isi perubahan SQL (ALTER/CREATE/INSERT seperlunya).
3. Jalankan lagi:

```bash
npm run db:migrate
```

## Catatan penting
- Jangan edit file migration yang sudah pernah dieksekusi.
- Kalau perlu perubahan baru, buat file migration baru berikutnya.
