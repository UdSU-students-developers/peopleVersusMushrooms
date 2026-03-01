module.exports = (mediator, Answer) => {
    const { TESTDB } = mediator.getTriggerTypes();

    return async (req, res) => {
        const params = {
            userId: req.params.userId,
        };
        
        if (!params.userId) {
            return res.json(Answer.bad(242));
        }

        const response = await mediator.get(TESTDB, params);

        if (response && response.error) {
            return res.json(Answer.bad(response.error));
        }
        
        res.json(Answer.good(response));
    };
};