CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
