module.exports = (mediator, answer, common) => {
    const { GET_LOBBIES } = mediator.getTriggerTypes();

    return async (req, res) => {
        const { guid } = req.params;
        
        if (!common.checkGuid(guid)) {
            return res.json(answer.bad(242));
        }

        const response = await mediator.get(GET_LOBBIES, { guid });

        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }
        
        res.json(answer.good(response));
    };
};
