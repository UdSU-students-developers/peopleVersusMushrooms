module.exports = (mediator, Answer) => {
    const { LOGIN } = mediator.getTriggerTypes();

    return async (req, res) => {
        const params = {
            login: req.params.login,
            passwordHash: req.params.passwordHash,
        };
        
        if (!params.login || !params.passwordHash ) {
            return res.json(Answer.bad(242));
        }

        const response = await mediator.get(LOGIN, params);

        if (response && response.error) {
            return res.json(Answer.bad(response.error));
        }
        
        res.json(Answer.good(response));
    };
};