module.exports = (mediator, answer, common) => {
    const { DROP_FROM_LOBBY } = mediator.getEventTypes();

    return async (req, res) => {
        const { guid, targetGuid } = req.body;
        
        if (!common.checkGuid(guid) || !common.checkGuid(targetGuid)) {
            return res.json(answer.bad(242));
        }

        const response = await mediator.call(DROP_FROM_LOBBY, { guid, targetGuid });

        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }
        
        res.json(answer.good(response));
    };
};