CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT    NOT NULL,
  password TEXT    NOT NULL,
  guid     TEXT,
  token    TEXT
);

CREATE TABLE IF NOT EXISTS unit_types (
  type    TEXT    PRIMARY KEY,
  hp      INTEGER NOT NULL,
  speed   REAL    NOT NULL,
  range   INTEGER NOT NULL,
  visible INTEGER NOT NULL
);

-- speed = очков ходьбы за такт (INTERVAL=100ms => 10 тактов/сек)
-- soldier 0.3 → шаг ~раз в 4 такта (около 400 мс)
-- bmp     0.7 → шаг ~раз в 2 такта (около 200 мс)
INSERT OR REPLACE INTO unit_types (type, hp, speed, range, visible) VALUES
  ('soldier', 10,  0.3, 3, 5),
  ('bmp',    100,  0.7, 5, 3);
