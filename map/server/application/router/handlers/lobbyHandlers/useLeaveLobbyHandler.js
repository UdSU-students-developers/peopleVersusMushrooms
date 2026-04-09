module.exports = (mediator, answer, common) => {
    const { LEAVE_LOBBY } = mediator.getEventTypes();

    return async (req, res) => {
        const { guid } = req.body;
        
        if (!common.checkGuid(guid)) {
            return res.json(answer.bad(242));
        }

        const response = await mediator.call(LEAVE_LOBBY, guid);

        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }
        
        res.json(answer.good(response));
    };
};