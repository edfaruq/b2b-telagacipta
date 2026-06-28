-- Remove unused Biteship integration columns from pengiriman (added in 018)
SET @db := DATABASE();
SET @sql := IF(
  (SELECT COUNT(*)
   FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db
     AND TABLE_NAME = 'pengiriman'
     AND COLUMN_NAME = 'biteship_order_id') > 0,
  'ALTER TABLE pengiriman
     DROP COLUMN biteship_courier_type,
     DROP COLUMN biteship_courier_code,
     DROP COLUMN biteship_order_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
