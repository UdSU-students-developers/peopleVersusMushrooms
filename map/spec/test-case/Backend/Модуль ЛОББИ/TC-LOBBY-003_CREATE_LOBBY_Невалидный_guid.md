|**Статус**|Не автоматизирован|
|:-----|:---------|
| **Идентификатор** | TC-LOBBY-003 |
| **Приоритет** | Высокий |
| **Название тест-кейса** | CREATE_LOBBY_Невалидный_guid.md |
| **Указание на модуль тестирования** | Лобби |
| **Исходные данные** | guid: "invalid-guid", lobbyName: "My Lobby", role: "spectator" |
| **Шаги тест-кейса** | 1. Отправить POST запрос на `http://localhost:3001/createLobby` с телом: `{"guid": "invalid-guid", "lobbyName": "My Lobby", "role": "spectator"}` <br> 2. Проверить ответ |
| **Ожидаемый результат** | HTTP 200, `{"result": "error", "error": {"code": 242, "message": "Не переданы все необходимые параметры"}}`