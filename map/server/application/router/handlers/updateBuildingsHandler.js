const updateBuildingsHandler = (mediator, answer, common) => {
    const { UPDATE_BUILDINGS_HANDLER } = mediator.getTriggerTypes();

    return (req, res) => {
        const { mapGuid, userGuid, buildings } = req.body;
            if (!mapGuid || !userGuid || !buildings) {
                return res.json(answer.bad(242));
            }
            //проверка гуидов
            if (!(common.checkGuid(mapGuid) && common.checkGuid(userGuid))) {
                return res.json(answer.bad(3001));
            }

        res.json(mediator.get(UPDATE_BUILDINGS_HANDLER, { mapGuid, userGuid, buildings }));
    }
}

module.exports = updateBuildingsHandler;