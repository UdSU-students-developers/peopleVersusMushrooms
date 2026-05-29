module.exports = (mediator, answer) => {
    const { START_GAME } = mediator.getEventTypes();

    return (req, res) => {

        const guids = {
            spectator: spectator,
            peopleArmy: peopleArmy,
            peopleEconomy: peopleEconomy,
            mushroomsArmy: mushroomsArmy,
            mushroomsEconomy: mushroomsEconomy,
            mapGuid: mapGuid,
        } = req.body;

        console.log(guids);
        
        const response = mediator.call(START_GAME, {guids}); //Тут startPoint дополнительно к guid

        if (response?.result) {
            return res.send(response);
        }

        return res.send(answer.bad(9000));
    };
};