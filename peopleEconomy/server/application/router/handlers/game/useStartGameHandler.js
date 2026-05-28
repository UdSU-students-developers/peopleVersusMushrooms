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

        //console.log(guids);

        const response = mediator.call(START_GAME, { guids }); 

        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }

        return res.json(answer.good(true));
    };
};