const useUpdateBuildingsHandler = (mediator, answer, common) => {
    const { UPDATE_BUILDINGS_HANDLER } = mediator.getTriggerTypes();

    return (req, res) => {
        const { mapGuid, userGuid, entities } = req.body;
            if (!mapGuid || !userGuid || !entities) {
                return res.json(answer.bad(242));
            }
            //проверка гуидов
            if (!(common.checkGuid(mapGuid) && common.checkGuid(userGuid))) {
                return res.json(answer.bad(3001));
            }

        res.json(answer.good(mediator.get(UPDATE_BUILDINGS_HANDLER, { mapGuid, userGuid, entities })));
    }
}

module.exports = useUpdateBuildingsHandler;