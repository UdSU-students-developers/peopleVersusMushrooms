const updateEconomyUnitsHandler = (mediator, answer, common) => {
    const { UPDATE_ECONOMY_UNITS_HANDLER } = mediator.getTriggerTypes();

    return (req, res) => {
        const { mapGuid, userGuid, unitsJSON } = req.params;
        //проверка гуидов
        if (!(common.checkGuid(mapGuid) && common.checkGuid(userGuid))) {
            return res.json(answer.bad(3001));
        }
        //проверить units
        let units = null;
        try {
            units = JSON.parse(unitsJSON);
        } catch (e) {
            return res.json(answer.bad(3009)) 
        }
        if (!(Array.isArray(units))) {
            return res.json(answer.bad(3009))
        }
        res.json(mediator.get(UPDATE_ECONOMY_UNITS_HANDLER, { mapGuid, userGuid, units}));
    }
}

module.exports = updateEconomyUnitsHandler;