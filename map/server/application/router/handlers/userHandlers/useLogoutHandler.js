module.exports = (mediator, Answer) => {
    const { LOGOUT } = mediator.getTriggerTypes();

    return async (req, res) => {
        const params = {
            token: req.params.token,
        };
        
        if (!params.token) {
            return res.json(Answer.bad(242));
        }

        const response = await mediator.get(LOGOUT, params);

        if (response && response.error) {
            return res.json(Answer.bad(response.error));
        }
        
        res.json(Answer.good(response));
    };
};