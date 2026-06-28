-- Remove unused draft status from penawaran
UPDATE penawaran SET status_penawaran = 'dikirim' WHERE status_penawaran = 'draft';

ALTER TABLE penawaran
  MODIFY COLUMN status_penawaran ENUM('dikirim', 'disetujui', 'ditolak') NOT NULL DEFAULT 'dikirim';
