module.exports = (mediator, answer, common) => {
    const { CREATE_LOBBY } = mediator.getEventTypes();

    return async (req, res) => {
        const { guid, lobbyName, role } = req.body;
        
        if (!common.checkGuid(guid) || !lobbyName) {
            return res.json(answer.bad(242));
        }

        const response = await mediator.call(CREATE_LOBBY, { guid, lobbyName, role });

        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }
        
        res.json(answer.good(response));
    };
};