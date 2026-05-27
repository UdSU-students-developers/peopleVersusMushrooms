|**Статус**|Не автоматизирован|
|:-----|:---------|
| **Идентификатор** | TC-LOBBY-001 |
| **Приоритет** | Высокий |
| **Название тест-кейса** | CREATE_LOBBY_Успешное_создание_лобби.md |
| **Указание на модуль тестирования** | Лобби |
| **Исходные данные** | guid: "123e4567-e89b-12d3-a456-426614174000", lobbyName: "My Lobby", role: "spectator" |
| **Шаги тест-кейса** | 1. Отправить POST запрос на `http://localhost:3001/createLobby` с телом: `{"guid": "123e4567-e89b-12d3-a456-426614174000", "lobbyName": "My Lobby", "role": "spectator"}` <br> 2. Проверить ответ |
| **Ожидаемый результат** | HTTP 200, `{"result": "ok", "data": {"lobbyName": "My Lobby", "lobbyGuid": "123e4567-e89b-12d3-a456-426614174000", "playersGuids": {"spectator": "123e4567-e89b-12d3-a456-426614174000", "peopleArmy": null, "peopleEconomy": null, "mushroomArmy": null, "mushroomEconomy": null}, "playersIsReady": {"spectator": false, "peopleArmy": false, "peopleEconomy": false, "mushroomArmy": false, "mushroomEconomy": false}}}`