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
  ('soldier',  20, 1,  3,  50,  5),
  ('bmp',     130, 3,  5,  70, 20),
  ('sniper',   18, 1, 12, 150, 22),
  ('partizan', 72, 4,  8, 100, 14);
