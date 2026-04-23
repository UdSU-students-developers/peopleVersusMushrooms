const { MAP, URLS } = require('../../../../../global/globalConfig');

module.exports = (mediator, answer) => {
    return async (req, res) => {
        const { mapGuid, peopleArmy: guid } = req.body;

        if (!guid || !mapGuid) {
            return res.json(answer.bad(400));
        }

        // запрашиваем рельеф у map-сервиса
        let map = null;
        try {
            const response = await fetch(`${MAP.URL}${URLS.GET_RELIEF}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json;charset=utf-8' },
                body: JSON.stringify({ mapGuid, userGuid: guid }),
            });
            const body = await response.json();
            if (body?.result === 'ok') {
                map = body.data;
            }
        } catch (e) {
            console.log('startGameHandler: не удалось получить рельеф', e);
        }

        if (!map) {
            return res.json(answer.bad(400));
        }

        const { START_GAME } = mediator.getEventTypes();
        mediator.call(START_GAME, { guid, mapGuid, map, buildings: [] });
        res.json(answer.good(true));
    };
};
