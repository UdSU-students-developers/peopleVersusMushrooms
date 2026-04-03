CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT    NOT NULL,
  password TEXT    NOT NULL,
  guid     TEXT,
  token    TEXT
);

DROP TABLE IF EXISTS unit_types;

CREATE TABLE unit_types (
  type    TEXT    PRIMARY KEY,
  hp      INTEGER NOT NULL,
  speed   INTEGER NOT NULL,
  range   INTEGER NOT NULL,
  visible INTEGER NOT NULL,
  damage  INTEGER NOT NULL
);

INSERT OR REPLACE INTO unit_types (type, hp, speed, range, visible, damage) VALUES
  ('soldier', 10,  1,  3,  5,  3),
  ('bmp',    100,  3,  5,  3, 25),
  ('sniper',  10,  1, 12, 15,  8),
  ('partizan', 10, 4,  8, 10,  5);
