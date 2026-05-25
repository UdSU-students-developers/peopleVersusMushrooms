# Описание API

Документация микросервиса `peopleArmy`: **HTTP-ручки**, **сокеты** и структуры данных для клиента армии людей.

**Содержание**

1. Общее
   * 1.1. Адрес сервера
   * 1.2. Протокол и формат ответа
   * 1.3. Условия работы с армией
2. Структуры данных
   * 2.1. Общий формат ответа
   * 2.2. Unit (свой юнит)
   * 2.3. ArmyState (снимок армии)
   * 2.4. Вражеские сущности (с карты)
3. HTTP — юниты
   * 3.1 CREATE_UNIT
   * 3.2 UNIT_TAKE_DAMAGE
   * 3.3 Общие ошибки
4. HTTP — лобби и старт игры
   * 4.1 LOBBY_UPDATED
   * 4.2 START_GAME
5. WebSocket
   * 5.1 START_GAME
   * 5.2 UPDATE_ARMY

## 1. Общее

### 1.1. Адрес сервера

`http://localhost:3007`

WebSocket подключается к тому же хосту и порту (см. `app.js`, `socket.io`).

### 1.2. Протокол и формат ответа

HTTP-ручки возвращают `JSON`. Для разделов **3** и **4** — **`POST`**, тело — **`application/json`**.

При ошибке в ручках юнитов сервер отвечает HTTP **400** и телом `Answer` с `result: "error"`.

Токен авторизации (если используется клиентом) передаётся в **query** (`?token=...`) по соглашению с `UserManager` в `global`.

### 1.3. Условия работы с армией

1. Пользователь должен быть **залогинен** (сокет `LOGIN`).
2. Игра для роли `peopleArmy` должна быть **запущена** (`POST /startGame` или цепочка лобби → map → этот эндпоинт). Только после этого создаётся экземпляр `Army` и доступны `CREATE_UNIT` / бой.
3. **Ручки движения юнита (`MOVE_UNIT`) в сервисе нет.** Марш и авто-цели задаёт игровой цикл на сервере (`Army.setUnitsTarget`, `moveUnits`). Управление целью с клиента пока не реализовано.

Типы юнитов и статы загружаются из БД (`unit_types`): `soldier`, `bmp`, `sniper`, `partizan`.

## 2. Структуры данных

### 2.1. Общий формат ответа

`T` — полезные данные успешного ответа.

```
Answer<T>: {
    result: 'ok' | 'error';
    data?: T;
    error?: string;
    code?: number;
}
```

И HTTP, и сокеты используют этот формат в поле ответа (для сокетов — весь объект события).

### 2.2. Unit (свой юнит)

Возвращается из `CREATE_UNIT` и в массиве `units` в `UPDATE_ARMY`.

```
{
    guid: string;
    type: string;           // soldier | bmp | sniper | partizan
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    speed: number;
    range: number;
    visible: number;        // радиус видимости на карте
    targetX: number | null; // цель марша (сервер)
    targetY: number | null;
}
```

### 2.3. ArmyState (снимок армии)

Пушится сокетом `UPDATE_ARMY` каждый игровой тик после обновления видимости с map-сервиса.

```
{
    units: Unit[];
    enemyUnits: EnemyUnit[];              // видимые юниты грибов (с карты)
    enemyBuildings: EnemyBuilding[];      // видимые вражеские здания (живые)
    alliedBuildings: EnemyBuilding[];     // здания peopleEconomy в видимости (не атакуются)
    destroyedEnemyBuildingGuids: string[]; // guid зданий, уничтоженных нашей армией локально
}
```

Поле `hp` у вражеских зданий на карте может отсутствовать; сервер накапливает урон локально после выстрелов. Guid из `destroyedEnemyBuildingGuids` нужно убирать с клиента даже если карта ещё отдаёт здание в `enemyBuildings`.

### 2.4. Вражеские сущности (с карты)

Формат задаётся map / `GET_VISIBILITY`. Минимально ожидается:

**EnemyUnit**

```
{
    guid: string;
    type: string;
    x: number;
    y: number;
    hp?: number;
    maxHp?: number;
    isAlive?: boolean;
    speed?: number;
    attackRange?: number;
}
```

**EnemyBuilding**

```
{
    guid: string;
    type: string;    // sporovaya_bashnya | vzryvomor | постройки economy и т.д.
    x: number;
    y: number;
    size?: number;   // футпринт (башня часто 2×2)
    hp?: number;     // может не приходить с карты
    isAlive?: boolean;
}
```

Урон по зданиям с сервера peopleArmy маршрутизируется: `sporovaya_bashnya` и `vzryvomor` → `mushroomsArmy` `/takeDamage`, остальные здания → `mushroomsEconomy` `APPLY_DAMAGE` (нужны `mushroomsArmy` и `mushroomsEconomy` в `guids` при старте).

## 3. HTTP — юниты

### 3.1 CREATE_UNIT

`POST /unit/create`

Создать юнита в армии пользователя. Армия должна уже существовать (после `START_GAME`).

**Тело запроса**

```
guid: string  - guid пользователя (владельца армии, роль peopleArmy)
x:    number  - координата X
y:    number  - координата Y
type?: string - тип юнита, по умолчанию 'soldier'
```

**Пример**

```json
{
  "guid": "1057329a-5fac-438c-8654-82a8d2de7a3d",
  "x": 4,
  "y": 4,
  "type": "bmp"
}
```

**Успешный ответ**

```
Answer<Unit>
```

**Ошибки**

* `11` — пользователь не найден или не залогинен
* `400` — неверные координаты / армия не найдена / неизвестный `type`
* `9000` — внутренняя ошибка

### 3.2 UNIT_TAKE_DAMAGE

`POST /unit/takeDamage`

Нанести урон **своему** юниту (тесты, внешние сервисы). Бой с грибами идёт автоматически в `Army.shotUnits`.

**Тело запроса**

```
userGuid: string - guid владельца армии
unitGuid: string - guid юнита
damage:   number - величина урона
```

**Пример**

```json
{
  "userGuid": "1057329a-5fac-438c-8654-82a8d2de7a3d",
  "unitGuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "damage": 15
}
```

**Успешный ответ**

```
Answer<{ guid: string; hp: number }>
```

При `hp <= 0` юнит удаляется из армии.

**Ошибки**

* `11` — ошибка авторизации
* `400` — неверные данные / армия не найдена
* `404` — юнит не найден
* `9000` — внутренняя ошибка

### 3.3 Общие ошибки

Коды из `Answer.js` (не все используются ручками армии):

* `11` — ошибка авторизации
* `13` — отсутствуют обязательные параметры (name/password/token)
* `17` — пользователь с таким именем уже существует
* `400` — неверные данные запроса
* `404` — не найдено
* `409` — пользователь с таким именем уже существует
* `422` — юнит с таким идентификатором уже существует
* `9000` — ошибка сервера

## 4. HTTP — лобби и старт игры

`POST`, тело — `JSON` (`Content-Type: application/json`).

### 4.1 LOBBY_UPDATED

`POST /lobbyUpdated`

Передать актуальный список лобби в медиатор (вызывается map/лобби-сервисом).

**Тело запроса**

```
lobbies: object | array - данные лобби
```

**Пример**

```json
{
  "lobbies": []
}
```

**Ответ**

```
Answer<true>
```

**Ошибки**

* `11` — не передано поле `lobbies`

### 4.2 START_GAME

`POST /startGame`

Создать армию людей: загрузить рельеф с map, запустить игровой цикл, отправить клиенту сокет `START_GAME` с картой.

**Тело запроса**

```
mapGuid: string - guid карты
...guids       - guid игроков по ролям (поля тела, кроме mapGuid)
```

Обязательно: `mapGuid` и `peopleArmy` (guid игрока за армию людей).

Рекомендуется передавать guid соперников для боя и урона:

* `mushroomsArmy` — армия грибов (`/takeDamage` по юнитам и башне/взрывомору)
* `mushroomsEconomy` — экономика грибов (урон по остальным зданиям)
* `spectator`, `peopleEconomy` — по необходимости для карты

**Пример**

```json
{
  "mapGuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "spectator": "11111111-1111-1111-1111-111111111111",
  "peopleArmy": "1057329a-5fac-438c-8654-82a8d2de7a3d",
  "peopleEconomy": null,
  "mushroomsArmy": "22222222-2222-2222-2222-222222222222",
  "mushroomsEconomy": "33333333-3333-3333-3333-333333333333"
}
```

**Ответ HTTP**

```
Answer<true>
```

Фактическая карта для UI приходит **сокетом** `START_GAME` (см. раздел 5.1). Если пользователь не онлайн или map не вернул рельеф, армия не создаётся (HTTP всё равно может вернуть `ok`).

**Ошибки HTTP**

* `400` — нет `mapGuid` или нет `peopleArmy` в теле

## 5. WebSocket

Подключение после `LOGIN`. События в `config.js` → `SOCKETS`.

### 5.1 START_GAME

**Событие (сервер → клиент):** `START_GAME`

Отправляется в сокет пользователя `peopleArmy` после успешного `eventStartGame`.

**Данные**

```
Answer<{
    map: number[][]   // рельеф карты (коды клеток), с map GET_RELIEF
}>
```

Клиент сохраняет `map` и переходит на экран игры.

### 5.2 UPDATE_ARMY

**Событие (сервер → клиент):** `UPDATE_ARMY`

Отправляется **каждый игровой тик** (интервал из `global/globalConfig` → `INTERVAL`) после:

1. отправки позиций своих юнитов на map (`UPDATE_UNITS`);
2. запроса видимости (`GET_VISIBILITY`);
3. локального боя (`shotUnits`) и движения (`moveUnits`).

**Данные**

```
Answer<ArmyState>
```

См. структуру **2.3**. Клиент обычно:

* полностью заменяет `enemyUnits`;
* **мержит** `enemyBuildings` по `guid` (пустой тик не очищает уже показанные здания);
* удаляет здания по `destroyedEnemyBuildingGuids` и при `hp <= 0` / `isAlive === false`.

---

**Не реализовано в текущей версии**

* `POST /unit/move` — назначение цели движения с клиента
* Сокетные ручки лобби/чата — в `global` (`LobbyManager`, `UserManager`), не в HTTP `peopleArmy`
