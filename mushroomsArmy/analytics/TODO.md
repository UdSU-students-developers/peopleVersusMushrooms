# Оставшиеся задачи — mushroomsArmy

## Обязательные

### 1. Реализовать запись ошибок в БД
**Файл:** `server/application/modules/BaseManager.ts`, `server/application/modules/db/DB.ts`

Метод `logErrorToDB` — заглушка (пишет только в `console.error`). Нужно:
- Добавить таблицу `errors` в `DB.ts`:
```sql
CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    code INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```
- Реализовать `logErrorToDB` в `BaseManager.ts` — писать в эту таблицу через `this.db`.

---

### 2. Почистить устаревшие обработчики ошибок на сервере
**Файл:** `server/application/modules/user/UserManager.ts` — `console.log('disconnect', socket.id)` должен быть `console.error` или убран.
`server/application/modules/db/DB.ts` — в `initTables` при ошибке только `console.error`, без проброса или записи в лог.

---

## Желательные

### 3. Вынести общие типы в отдельный пакет (shared types)
**Проблема:** `TBuilding`, `TUnit`, `TMap`, `TUnitState` дублируются в `mushroomsArmy`, `mushroomsEconomy` и `map`. При изменении типа в одном сервисе — остальные узнают об этом только при падении рантайма.

**Решение:** оформить как npm-пакет `@pvs/shared-types` внутри монорепы (или хотя бы вынести в общую папку `shared/` на корневом уровне).

Кандидаты для выноса:
- `TUnit` / `TUnitState`
- `TBuilding`
- `TMap` / `TPoint` (целочисленные координаты)

---

### 4. Централизованная обработка ошибок: запись в БД в catch-блоке
**Файл:** `server/application/modules/BaseManager.ts`

Сейчас в `catch` — только `console.error`. После реализации задачи №1 — дополнить `catch` вызовом `logErrorToDB` с кодом `9000` (сетевая ошибка).

---

## Процессные

### 5. Тимлидам: согласовать протокол обмена данными между сервисами
Необходимо зафиксировать контракты HTTP-запросов:

| Откуда | Куда | Метод + путь | Payload |
|--------|------|-------------|---------|
| mushroomsArmy | map | `POST /updateMushroomArmy/:mapGuid/:armyGuid` | `{ units }` |
| mushroomsArmy | map | `GET /getVisibility/:mapGuid/:armyGuid` | — → `{ entities: TVisibleEntity[] }` |
| peopleArmy | mushroomsArmy | `POST /takeDamage/:armyGuid` | `{ unitGuid, amount, type }` |
| map | mushroomsArmy | `POST /startGame/:armyGuid` | `{ mapGuid, map, buildings }` |
| mushroomsArmy | mushroomsEconomy | `POST /takeDamage` | `{ armyGuid, unitGuid, amount, type }` |
| mushroomsEconomy | mushroomsArmy | (задача экономики) `newUnit`, `checkPosition` — не описаны |

Нужно: каждый тимлид описывает свои входящие эндпоинты (путь, метод, payload, ответ).

---

## Правила разработки (в силе для всего нового кода)

- **Именование:** `T` — тип данных без методов (DTO), `I` — интерфейс поведения классов.
- **Никакого `any`** — каждый `any` = баг в будущем.
- **Никакого `interface` для DTO** — только `type`.
- **Никакого `@ts-ignore`** — если TS ругается, исправить тип.
- **Целочисленные координаты (`Math.floor`)** — дробные координаты вызывают рассинхрон между сервисами.
- **Событийная модель «двойного действия»:** каждое воздействие (удар, создание юнита) — это HTTP-вызов на соседний сервис + обработчик у себя.
- **Карта — единственный источник истины** о занятости клеток и типе ландшафта. Перед спавном/постройкой — `checkPosition` на сервис карты.
