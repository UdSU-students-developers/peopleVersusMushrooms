const updateUnitsHandler = (mediator, answer, common) => {
    const { UPDATE_UNITS_HANDLER } = mediator.getTriggerTypes();

    return (req, res) => {
        const { mapGuid, userGuid, units } = req.body;
            if (!mapGuid || !userGuid || !units) {
                return res.json(answer.bad(242));
            }
            //проверка гуидов
            if (!(common.checkGuid(mapGuid) && common.checkGuid(userGuid))) {
                return res.json(answer.bad(3001));
            }

        res.json(mediator.get(UPDATE_UNITS_HANDLER, { mapGuid, userGuid, units }));
    }
}

module.exports = updateUnitsHandler;