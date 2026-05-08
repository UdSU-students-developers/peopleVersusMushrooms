# Описание API

Здесь описано всё API, используемое микросервисом `mushroomsArmy`, с описанием структур данных.

**Содержание**

1. Общее
   * 1.1. Адрес сервера
   * 1.2. Используемый протокол
2. Структуры данных
   * 2.1. Общий формат ответа
   * 2.2. Lobby
   * 2.3. Unit
   * 2.4. Building
   * 2.5. SlimePuddle
   * 2.6. Projectile
   * 2.7. ArmyState
3. Список запросов
   * 3.1. Общие ошибки
4. Подробно
   * 4.1 **ЛОББИ**
   * * 4.1.1 LOBBY_UPDATED
   * * 4.1.2 GET_LOBBIES
   * 4.2 **АРМИЯ**
   * * 4.2.1 GET_ARMY
   * * 4.2.2 MOVE_UNIT
   * * 4.2.3 TAKE_DAMAGE
   * * 4.2.4 START_GAME
   * * 4.2.5 SPAWN_UNIT
   * * 4.2.6 SPAWN_BUILDING


## 1. Общее

### 1.1. Адрес сервера

`http://localhost:3003`

### 1.2. Используемый протокол

API полностью реализовано на HTTP(S).

Формат возвращаемых значений — `JSON`.

Все методы имеют тип `POST`, все параметры передаются в теле запроса.

## 2. Структуры данных

### 2.1. Общий формат ответа

`T` — какие-то данные. В случае успешного ответа возвращается `result = 'ok'` и поле `data` с данными.

В случае ошибки возвращается `result = 'error'` и поле `error` с кодом и текстом ошибки.

```
Answer<T>: {
    result: 'ok' | 'error';
    data?: T;
    error?: {
        code: number;
        text: string;
    };
}
```

### 2.2 Lobby

```
{
    lobbyName: string;     - название лобби
    lobbyGuid: string;     - гуид лобби
    playersGuids: {        - гуид каждого сервиса в лобби
        spectator:        string | null,
        peopleArmy:       string | null,
        peopleEconomy:    string | null,
        mushroomsArmy:    string | null,
        mushroomsEconomy: string | null,
    };
    playersIsReady: {      - готовность каждого сервиса в лобби
        spectator:        boolean,
        peopleArmy:       boolean,
        peopleEconomy:    boolean,
        mushroomsArmy:    boolean,
        mushroomsEconomy: boolean,
    };
}
```

### 2.3 Unit

Состояние юнита, возвращаемое в `ArmyState`.

```
{
    guid: string,        - гуид юнита
    type: string,        - тип юнита: 'sporomet' | 'champigneb' | 'eblekar'
    x: number,           - координата X
    y: number,           - координата Y
    hp: number,          - текущее здоровье
    isHealing?: boolean, - лечится ли юнит в данный момент (только eblekar)
}
```

> HP по типу (хардкод на сервере): sporomet — 8, champigneb — 35, eblekar — 40.

### 2.4 Building

Состояние здания, возвращаемое в `ArmyState`.

```
{
    guid: string,                - гуид здания
    type: string,                - тип: 'sporovaya_bashnya' | 'vzryvomor' | вражеские типы
    x: number,                   - координата X
    y: number,                   - координата Y
    hp: number,                  - текущее здоровье
    isAlive?: boolean,           - живо ли здание
    isExploding?: boolean,       - фаза взрыва (только vzryvomor)
    isAttacking?: boolean,       - атакует ли здание сейчас
    sizeX?: number,              - размер по оси X
    sizeY?: number,              - размер по оси Y
    attackRange?: number,        - дальность атаки
    attackDamage?: number,       - урон атаки
    respawn?: {                  - состояние возрождения (только vzryvomor)
        inProgress: boolean,
        respawnIn: number,
    };
}
```

> HP по типу (хардкод на сервере): vzryvomor — 70, sporovaya_bashnya — 160.

### 2.5 SlimePuddle

Лужа слизи, оставленная погибшим `champigneb`. Наносит урон вражеским юнитам в радиусе.

```
{
    x: number,      - координата X центра лужи
    y: number,      - координата Y центра лужи
    radius: number, - радиус лужи
    ttl: number,    - оставшееся время жизни (в тиках)
}
```

### 2.6 Projectile

Снаряд, выпущенный юнитом или зданием.

```
{
    guid: string,      - гуид снаряда
    type: string,      - тип снаряда: 'sporomet' | 'sporovaya_bashnya' | 'eblekar'
    fromX: number,     - координата X источника
    fromY: number,     - координата Y источника
    toX: number,       - координата X цели
    toY: number,       - координата Y цели
    createdAt: number, - timestamp создания (мс)
}
```

### 2.7 ArmyState

Полное состояние армии, возвращаемое запросом `GET_ARMY` и рассылаемое клиенту через Socket.IO.

```
{
    map: (number | null)[][], - карта проходимости (с туманом войны: невидимые клетки = null)
    units: Unit[],            - юниты армии
    buildings: Building[],    - здания армии (свои + видимые вражеские)
    slimePuddles: SlimePuddle[], - активные лужи слизи
    projectiles: Projectile[],   - снаряды в текущем тике
}
```


## 3. Список запросов

| **№** | **Название**   | **О чём**                                              |
| ----- | -------------- | ------------------------------------------------------ |
| 1.1   | LOBBY_UPDATED  | Получить обновлённый список лобби от сервиса карты     |
| 1.2   | GET_LOBBIES    | Прокси-запрос списка лобби с сервиса карты             |
| 2.1   | GET_ARMY       | Получить текущее состояние армии                       |
| 2.2   | MOVE_UNIT      | Назначить юниту целевую точку перемещения              |
| 2.3   | TAKE_DAMAGE    | Нанести урон юниту или зданию                          |
| 2.4   | START_GAME     | Инициализировать армию и начать игру                   |
| 2.5   | SPAWN_UNIT     | Заспавнить нового юнита в армию                        |
| 2.6   | SPAWN_BUILDING | Заспавнить новое здание в армию                        |

### 3.1. Общие ошибки

* `242` — не переданы все необходимые параметры, не пройдена валидация, или объект не найден
* `404` — маршрут не существует
* `9000` — неизвестная ошибка


## 4. Подробно

### 4.1 ЛОББИ

#### 4.1.1 LOBBY_UPDATED

`POST /lobbyUpdated`

Принять обновлённый список лобби от сервиса карты. Вызывается map-сервером автоматически при изменениях в лобби.

**Параметры**

```
{
    lobbies: Lobby[]; - актуальный список всех лобби
}
```

**Успешный ответ**

```
Answer<true>
```

**Ошибки**

* `242` — не передан параметр `lobbies`

---

#### 4.1.2 GET_LOBBIES

`POST /getLobbies`

Прокси-запрос: сервер пересылает запрос на map-сервер (`http://localhost:3001/getLobbies`) и возвращает список лобби.

**Параметры**

```
{
    guid: string; - гуид пользователя
}
```

**Успешный ответ**

```
Answer<Lobby[]>
```

**Ошибки**

* `242` — map-сервер вернул ошибку или недоступен

---

### 4.2 АРМИЯ

#### 4.2.1 GET_ARMY

`POST /getArmy`

Получить текущее состояние армии по её гуиду.

**Параметры**

```
{
    armyGuid: string; - гуид армии
}
```

**Успешный ответ**

```
Answer<ArmyState>
```

**Ошибки**

* `242` — не передан `armyGuid`, либо армия не найдена

---

#### 4.2.2 MOVE_UNIT

`POST /moveUnit`

Назначить юниту целевую точку перемещения.

**Параметры**

```
{
    armyGuid: string; - гуид армии
    unitGuid: string; - гуид юнита
    x: number;        - целевая координата X (конечное число)
    y: number;        - целевая координата Y (конечное число)
}
```

**Успешный ответ**

```
Answer<true>
```

**Ошибки**

* `242` — не переданы все параметры, `x`/`y` не конечные числа, армия или юнит не найдены

---

#### 4.2.3 TAKE_DAMAGE

`POST /takeDamage`

Нанести урон юниту или зданию указанной армии. Все параметры передаются в теле запроса.

**Параметры**

```
{
    armyGuid: string; - гуид армии, по которой наносится урон
    unitGuid: string; - гуид юнита или здания, по которому наносится урон
    amount: number;   - величина урона (конечное число >= 0)
}
```

**Успешный ответ**

```
Answer<true>
```

**Ошибки**

* `242` — не переданы все параметры, `amount` отрицательный или не конечное число, армия или цель не найдены

---

#### 4.2.4 START_GAME

`POST /startGame`

Инициализировать армию и начать игру. Принимает `armyGuid` или `mushroomsArmy` — оба варианта эквивалентны (для совместимости с разными вызывающими сервисами).

**Параметры**

```
{
    armyGuid?:      string;              - гуид армии (вариант 1)
    mushroomsArmy?: string;              - гуид армии (вариант 2, от map-сервера)
    mapGuid:        string;              - гуид карты
    map?:           (number | null)[][]; - карта проходимости (если не передана — запрашивается у map-сервера)
    buildings?:     BuildingInput[];     - стартовый список зданий (если не передан — генерируется автоматически)
}
```

Структура `BuildingInput`:

```
{
    guid:         string,
    type:         string,
    x:            number,
    y:            number,
    hp?:          number,
    attackRange?: number,
    sizeX?:       number,
    sizeY?:       number,
}
```

**Успешный ответ**

```
Answer<true>
```

**Ошибки**

* `242` — не передан `armyGuid`/`mushroomsArmy` или `mapGuid`

---

#### 4.2.5 SPAWN_UNIT

`POST /spawnUnit`

Заспавнить нового юнита в армию. Вызывается сервисом `mushroomsEconomy` когда инкубатор вырастил юнита.

**Параметры**

```
{
    armyGuid: string;                                - гуид армии
    type:     'sporomet' | 'champigneb' | 'eblekar'; - тип юнита
    x:        number;                                - координата X спавна
    y:        number;                                - координата Y спавна
}
```

**Успешный ответ**

```
Answer<{ guid: string }> - гуид созданного юнита
```

**Ошибки**

* `242` — не переданы все параметры, `type` не из допустимых значений, `x`/`y` не конечные числа, армия не найдена, тайл занят водой (`1`) или туманом (`null`), координаты вне границ карты

---

#### 4.2.6 SPAWN_BUILDING

`POST /spawnBuilding`

Заспавнить новое здание в армию.

**Параметры**

```
{
    armyGuid: string;                            - гуид армии
    type:     'vzryvomor' | 'sporovaya_bashnya'; - тип здания
    x:        number;                            - координата X спавна
    y:        number;                            - координата Y спавна
}
```

**Успешный ответ**

```
Answer<{ guid: string }> - гуид созданного здания
```

**Ошибки**

* `242` — не переданы все параметры, `type` не из допустимых значений, `x`/`y` не конечные числа, армия не найдена
