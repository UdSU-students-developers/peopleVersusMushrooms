|**Статус**|Не автоматизирован|
|:-----|:---------|
| **Идентификатор** | TC-LOBBY-004 |
| **Приоритет** | Высокий |
| **Название тест-кейса** | JOIN_TO_LOBBY_Успешное_подключение.md |
| **Указание на модуль тестирования** | Лобби |
| **Исходные данные** | Предварительно создано лобби с lobbyGuid="11111111-1111-1111-1111-111111111111". Второй пользователь с guid="22222222-2222-2222-2222-222222222222" |
| **Шаги тест-кейса** | 1. Отправить POST запрос на `http://localhost:3001/joinToLobby` с телом: `{"guid": "22222222-2222-2222-2222-222222222222", "lobbyGuid": "11111111-1111-1111-1111-111111111111", "role": "peopleArmy"}` <br> 2. Проверить ответ |
| **Ожидаемый результат** | HTTP 200, `{"result": "ok", "data": {"lobbyName": "My Lobby", "lobbyGuid": "11111111-1111-1111-1111-111111111111", "playersGuids": {"spectator": "11111111-1111-1111-1111-111111111111", "peopleArmy": "22222222-2222-2222-2222-222222222222", "peopleEconomy": null, "mushroomArmy": null, "mushroomEconomy": null}, "playersIsReady": {"spectator": false, "peopleArmy": false, "peopleEconomy": false, "mushroomArmy": false, "mushroomEconomy": false}}}`