module.exports = (mediator, answer) => {
    const { START_GAME } = mediator.getEventTypes();
    const { SET_SERIVCES_GUIDS } = mediator.getTriggerTypes();

    return async (req, res) => {
        const guids = { mapGuid,
            spectator,
            peopleArmy,
            peopleEconomy,
            mushroomArmy,
            mushroomEconomy 
        } = req.body;
        

        this.mediator.call(SET_SERIVCES_GUIDS, guids);
        const response = await mediator.call(START_GAME, { guid });

        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }
        
        res.json(answer.good(response));
    };
};