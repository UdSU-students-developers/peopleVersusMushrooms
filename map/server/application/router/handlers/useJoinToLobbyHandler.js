module.exports = (mediator, answer, common) => {
    const { JOIN_TO_LOBBY } = mediator.getEventTypes();

    return async (req, res) => {
        const { guid, lobbyGuid, role } = req.body;
        
        if (!common.checkGuid(guid) || !common.checkGuid(lobbyGuid) || !role) {
            return res.json(answer.bad(242));
        }

        const response = await mediator.call(JOIN_TO_LOBBY, { guid, lobbyGuid, role });

        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }
        
        res.json(answer.good(response));
    };
};

