module.exports = (mediator, answer) => {
    const { START_GAME } = mediator.getEventTypes();


    return (req, res) => {
        const guids = { 
            spectator: spectator,
            peopleArmy: peopleArmy,
            peopleEconomy: peopleEconomy,
            mushroomsArmy: mushroomArmy,
            mushroomsEconomy: mushroomEconomy,
        } = req.body;

        //console.log(guids);
        
        const response = mediator.call(START_GAME, data = { guids }); //Тут startPoint дополнительно к guid

        if (response && response.error) {
            return res.send(answer.bad(response.error));
        }
        
        console.log("SSSSSTTTTTTAAAAARRRRRTTTTT");
        res.send(answer.good(response));
    };
};