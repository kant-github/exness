-- Check TimescaleDB extension
\echo '--- Extensions ---'
\dx timescaledb

-- Check hypertables
\echo '--- Hypertables ---'
SELECT hypertable_name FROM timescaledb_information.hypertables;

-- Check continuous aggregates
\echo '--- Continuous Aggregates ---'
SELECT matviewname AS continuous_aggregate
FROM pg_matviews
WHERE definition LIKE '%WITH (timescaledb.continuous)%';

-- Check refresh policies
\echo '--- Refresh Policies ---'
SELECT job_id, application_name, schedule_interval, config
FROM timescaledb_information.jobs
WHERE application_name LIKE 'Refresh Continuous Aggregate%';