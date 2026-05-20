module.exports = (mediator, answer) => {
    return (req, res) => {
        const { mapGuid, ...guids } = req.body;

        if (!mapGuid || !guids.peopleArmy) {
            return res.json(answer.bad(400));
        }

        const { START_GAME } = mediator.getEventTypes();
        console.log(mapGuid, guids);
        mediator.call(START_GAME, { mapGuid, guids });
        res.json(answer.good(true));
    };
};
