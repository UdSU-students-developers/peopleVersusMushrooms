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
  speed   INTEGER NOT NULL,
  range   INTEGER NOT NULL,
  visible INTEGER NOT NULL,
  damage  INTEGER NOT NULL
);

INSERT OR REPLACE INTO unit_types (type, hp, speed, range, visible, damage) VALUES
  ('soldier',  20, 1,  3,  5,  9),
  ('bmp',     100, 3,  5,  7, 25),
  ('sniper',   20, 1, 20, 25, 9),
  ('partizan', 30, 4,  7, 10, 15);
