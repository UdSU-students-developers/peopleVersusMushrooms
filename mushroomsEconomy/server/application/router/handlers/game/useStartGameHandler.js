module.exports = (mediator, answer) => {
    const { START_GAME } = mediator.getEventTypes();
    const { SET_SERVICES_GUIDS } = mediator.getTriggerTypes();


    return (req, res) => {
        const guids = { mapGuid,
            spectator,
            peopleArmy,
            peopleEconomy,
            mushroomArmy,
            mushroomEconomy 
        } = req.body;
        
        const response = mediator.call(START_GAME, { guids }); //Тут startPoint дополнительно к guid
        mediator.call(SET_SERVICES_GUIDS, guids);

        if (response && response.error) {
            return res.send(answer.bad(response.error));
        }
        
        console.log("SSSSSTTTTTTAAAAARRRRRTTTTT");
        res.send(answer.good(response));
    };
};