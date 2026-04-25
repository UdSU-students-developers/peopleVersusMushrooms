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
   * * 4.2.4 START_GAME (с armyGuid в URL)
   * * 4.2.5 START_GAME (с mushroomArmy в теле)

## 1. Общее

### 1.1. Адрес сервера

`http://localhost:3003`

### 1.2. Используемый протокол

API полностью реализовано на http(s).

Формат возвращаемых значений `JSON`.

Все методы, если это особо не оговорено, имеют тип `POST` и параметры передают внутри своего тела.

## 2. Структуры данных

### 2.1. Общий формат ответа

`T` - какие-то данные. В случае успешного ответа возвращается `result = 'ok'` и поле `data` с данными.

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

Здесь и всюду далее под типом данных `lobby` будет иметься ввиду следующее
```
{
    lobbyName: string; - название лобби
    lobbyGuid: string; - гуид лобби
    playersGuids: {    - гуид каждого сервиса в лобби
        spectator:        string | null,
        peopleArmy:       string | null,
        peopleEconomy:    string | null,
        mushroomsArmy:    string | null,
        mushroomsEconomy: string | null,
    };
    playersIsReady: {  - готовность каждого сервиса в лобби
        spectator:        true | false,
        peopleArmy:       true | false,
        peopleEconomy:    true | false,
        mushroomsArmy:    true | false,
        mushroomsEconomy: true | false,
    };
}
```

### 2.3 Unit

Здесь и всюду далее под типом данных `unit` будет иметься ввиду следующее
```
{
    guid: string,        - гуид юнита
    type: string,        - тип юнита (sporomet | champigneb | eblekar)
    x: number,           - координата X
    y: number,           - координата Y
    hp: number,          - текущее здоровье
    maxHp: number,       - максимальное здоровье
    isAlive: boolean,    - жив ли юнит
    speed: number,       - скорость передвижения
    attackRange: number, - дальность атаки
}
```

### 2.4 Building

Здесь и всюду далее под типом данных `building` будет иметься ввиду следующее
```
{
    guid: string,                - гуид здания
    type: string,                - тип здания (sporovaya_bashnya | vzryvomor | house | barracks | tower)
    x: number,                   - координата X
    y: number,                   - координата Y
    hp: number,                  - текущее здоровье
    maxHp: number,               - максимальное здоровье
    isAlive?: boolean,           - живо ли здание
    isExploding?: boolean,       - находится ли в фазе взрыва (только vzryvomor)
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

### 2.5 SlimePuddle

Лужа слизи, оставленная мёртвым `champigneb`. Наносит урон вражеским юнитам, попавшим в радиус.
```
{
    x: number,      - координата X центра лужи
    y: number,      - координата Y центра лужи
    radius: number, - радиус лужи
    ttl: number,    - оставшееся время жизни (в секундах)
}
```

### 2.6 Projectile

Снаряд, выпущенный юнитом или зданием.
```
{
    x: number,         - координата X
    y: number,         - координата Y
    targetX: number,   - координата X цели
    targetY: number,   - координата Y цели
    type: string,      - тип снаряда
    sourceGuid: string - гуид источника снаряда
}
```

### 2.7 ArmyState

Полное состояние армии, возвращаемое запросом `GET_ARMY`.
```
{
    map: (number | null)[][], - карта проходимости
    units: [unit],            - все юниты армии
    buildings: [building],    - все здания армии (включая видимые вражеские)
    slimePuddles: [SlimePuddle], - активные лужи слизи
    projectiles: [Projectile],   - снаряды в текущем тике
}
```

## 3. Список запросов

| **№** | **Название** | **О чем** |
| ----- | ------------ | --------- |
| 1 | **ЛОББИ** | |
| 1.1 | LOBBY_UPDATED | Получение обновлённого списка лобби от сервиса карты |
| 1.2 | GET_LOBBIES | Прокси-запрос списка лобби с сервиса карты |
| 2 | **АРМИЯ** | |
| 2.1 | GET_ARMY | Получить состояние армии |
| 2.2 | MOVE_UNIT | Переместить юнита |
| 2.3 | TAKE_DAMAGE | Нанести урон юниту/зданию |
| 2.4 | START_GAME (`/startGame/:armyGuid`) | Запустить игру для армии (guid в URL) |
| 2.5 | START_GAME (`/startGame`) | Запустить игру для армии (guid в теле) |

### 3.1. Общие ошибки

* `242` - не переданы все необходимые параметры (или не пройдена валидация)
* `404` - если данного `method` не существует
* `9000` - неизвестная ошибка

## 4. Подробно

### 4.1 ЛОББИ

#### 4.1.1 LOBBY_UPDATED

`POST /lobbyUpdated`

Принять обновлённый список лобби от сервиса карты. Сервис рассылает событие `LOBBY_UPDATED` через медиатор.

**Параметры**

```
{
    lobbies: [lobby]; - список всех лобби
}
```

**Успешный ответ**

```
Answer<true>
```

**Ошибки**

* `242` - не передан параметр `lobbies`

#### 4.1.2 GET_LOBBIES

`POST /getLobbies`

Прокси-запрос: сервер пересылает запрос на сервис карты (`http://localhost:3001/getLobbies`) и возвращает развёрнутый список лобби.

**Параметры**

```
{
    guid: string; - гуид пользователя
}
```

**Успешный ответ**

```
Answer<[lobby]>
```

**Ошибки**

* `242` - сервис карты вернул ошибку или недоступен

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

* `242` - не передан `armyGuid`, либо армия с таким гуидом не найдена

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

* `242` - не переданы все параметры, либо `x`/`y` не являются конечными числами, либо армия/юнит не найдены

#### 4.2.3 TAKE_DAMAGE

`POST /takeDamage/:armyGuid`

Нанести урон юниту или зданию указанной армии. `armyGuid` передаётся как параметр URL.

**URL-параметры**

```
armyGuid: string - гуид армии, по которой наносится урон
```

**Параметры тела**

```
{
    unitGuid: string; - гуид юнита или здания, по которому наносится урон
    amount: number;   - величина урона (конечное число >= 0)
    type: string;     - тип урона (например, 'physical', 'poison')
}
```

**Успешный ответ**

```
Answer<true>
```

**Ошибки**

* `242` - не переданы все параметры, либо `amount` отрицательный/не является конечным числом, либо армия/цель не найдены

#### 4.2.4 START_GAME (`/startGame/:armyGuid`)

`POST /startGame/:armyGuid`

Инициализировать армию и начать игру. Гуид армии передаётся как параметр URL.

**URL-параметры**

```
armyGuid: string - гуид армии
```

**Параметры тела**

```
{
    mapGuid:    string;  - гуид карты
    map:        (number | null)[][]; - карта проходимости
    buildings?: [        - стартовый список зданий (опционально, по умолчанию [])
        {
            guid:         string,
            type:         string, - 'sporovaya_bashnya' | 'vzryvomor' | вражеские типы
            x:            number,
            y:            number,
            hp:           number,
            maxHp:        number,
            attackRange?: number,
            sizeX?:       number,
            sizeY?:       number,
        }
    ]
}
```

**Успешный ответ**

```
Answer<true>
```

**Ошибки**

* `242` - не переданы `armyGuid`, `mapGuid` или `map`

#### 4.2.5 START_GAME (`/startGame`)

`POST /startGame`

Альтернативная версия запуска игры — гуид армии передаётся в теле под ключом `mushroomArmy`.

**Параметры**

```
{
    mushroomArmy: string; - гуид армии
    mapGuid:      string; - гуид карты
    map:          (number | null)[][]; - карта проходимости
    buildings?:   [building-input]; - стартовый список зданий (опционально, по умолчанию [])
}
```

Структура `building-input` идентична описанной в 4.2.4.

**Успешный ответ**

```
Answer<true>
```

**Ошибки**

* `242` - не переданы `mushroomArmy`, `mapGuid` или `map`
