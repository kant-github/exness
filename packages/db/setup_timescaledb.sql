-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert Trade table to hypertable
-- This will now work because trade_time is in the primary key
SELECT create_hypertable('"Trade"', 'trade_time', if_not_exists => TRUE);

-- Drop existing materialized views if they exist
DROP MATERIALIZED VIEW IF EXISTS trade_1m_cagg;
DROP MATERIALIZED VIEW IF EXISTS trade_5m_cagg;
DROP MATERIALIZED VIEW IF EXISTS trade_15m_cagg;
DROP MATERIALIZED VIEW IF EXISTS trade_1h_cagg;
DROP MATERIALIZED VIEW IF EXISTS trade_1d_cagg;
DROP MATERIALIZED VIEW IF EXISTS trade_15d_cagg;
DROP MATERIALIZED VIEW IF EXISTS trade_30d_cagg;

-- 1-minute aggregate
CREATE MATERIALIZED VIEW trade_1m_cagg
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 minute', trade_time) AS time,
  symbol,
  FIRST(price, trade_time) AS open,
  MAX(price) AS high,
  MIN(price) AS low,
  LAST(price, trade_time) AS close,
  SUM(quantity) AS quantity_total,
  SUM(price * quantity) AS volume,
  COUNT(*) AS trade_count
FROM "Trade"
GROUP BY time_bucket('1 minute', trade_time), symbol;

-- 5-minute aggregate
CREATE MATERIALIZED VIEW trade_5m_cagg
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('5 minutes', trade_time) AS time,
  symbol,
  FIRST(price, trade_time) AS open,
  MAX(price) AS high,
  MIN(price) AS low,
  LAST(price, trade_time) AS close,
  SUM(quantity) AS quantity_total,
  SUM(price * quantity) AS volume,
  COUNT(*) AS trade_count
FROM "Trade"
GROUP BY time_bucket('5 minutes', trade_time), symbol;

-- 15-minute
CREATE MATERIALIZED VIEW trade_15m_cagg
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('15 minutes', trade_time) AS time,
  symbol,
  FIRST(price, trade_time) AS open,
  MAX(price) AS high,
  MIN(price) AS low,
  LAST(price, trade_time) AS close,
  SUM(quantity) AS quantity_total,
  SUM(price * quantity) AS volume,
  COUNT(*) AS trade_count
FROM "Trade"
GROUP BY time_bucket('15 minutes', trade_time), symbol;

-- 1-hour
CREATE MATERIALIZED VIEW trade_1h_cagg
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 hour', trade_time) AS time,
  symbol,
  FIRST(price, trade_time) AS open,
  MAX(price) AS high,
  MIN(price) AS low,
  LAST(price, trade_time) AS close,
  SUM(quantity) AS quantity_total,
  SUM(price * quantity) AS volume,
  COUNT(*) AS trade_count
FROM "Trade"
GROUP BY time_bucket('1 hour', trade_time), symbol;

-- 1-day
CREATE MATERIALIZED VIEW trade_1d_cagg
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', trade_time) AS time,
  symbol,
  FIRST(price, trade_time) AS open,
  MAX(price) AS high,
  MIN(price) AS low,
  LAST(price, trade_time) AS close,
  SUM(quantity) AS quantity_total,
  SUM(price * quantity) AS volume,
  COUNT(*) AS trade_count
FROM "Trade"
GROUP BY time_bucket('1 day', trade_time), symbol;

-- Add refresh policies (use DO blocks to avoid errors if already exist)
DO $$ BEGIN
  PERFORM add_continuous_aggregate_policy('trade_1m_cagg',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Policy for trade_1m_cagg already exists or error: %', SQLERRM;
END $$;

DO $$ BEGIN
  PERFORM add_continuous_aggregate_policy('trade_5m_cagg',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes');
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Policy for trade_5m_cagg already exists or error: %', SQLERRM;
END $$;

DO $$ BEGIN
  PERFORM add_continuous_aggregate_policy('trade_15m_cagg',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '15 minutes',
    schedule_interval => INTERVAL '15 minutes');
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Policy for trade_15m_cagg already exists or error: %', SQLERRM;
END $$;

DO $$ BEGIN
  PERFORM add_continuous_aggregate_policy('trade_1h_cagg',
    start_offset => INTERVAL '12 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Policy for trade_1h_cagg already exists or error: %', SQLERRM;
END $$;

DO $$ BEGIN
  PERFORM add_continuous_aggregate_policy('trade_1d_cagg',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Policy for trade_1d_cagg already exists or error: %', SQLERRM;
END $$;