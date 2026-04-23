module.exports = (mediator, answer) => {
    const { START_GAME } = mediator.getEventTypes();
    const { SET_SERVICES_GUIDS } = mediator.getTriggerTypes();

    return async (req, res) => {
        const guids = { mapGuid,
            spectator,
            peopleArmy,
            peopleEconomy,
            mushroomArmy,
            mushroomEconomy 
        } = req.body;
        
        console.log("SSSSSTTTTTTAAAAARRRRRTTTTT");

        this.mediator.call(SET_SERVICES_GUIDS, guids);
        const response = await mediator.call(START_GAME, { guid });

        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }
        
        res.json(answer.good(response));
    };
};