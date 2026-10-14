CREATE TABLE IF NOT EXISTS fleet_vehicle_state (
  asset_id TEXT PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  odometer REAL NOT NULL DEFAULT 0,
  hourmeter REAL NOT NULL DEFAULT 0,
  last_reading_at TEXT
);
