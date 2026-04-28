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
        
        console.log('\n\n\n\n\ 1');

        const response = mediator.call(START_GAME, { guids }); //Тут startPoint дополнительно к guid
        this.mediator.call(SET_SERVICES_GUIDS, guids);
        console.log('\n\n\n\n\ 2');

        if (response && response.error) {
            return res.send(answer.bad(response.error));
        }
        
        console.log("SSSSSTTTTTTAAAAARRRRRTTTTT");
        res.send(answer.good(response));
    };
};