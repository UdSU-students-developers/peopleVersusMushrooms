module.exports = (mediator, Answer) => {
    const { REGISTRATION } = mediator.getTriggerTypes();

    return async (req, res) => {
        const params = {
            login: req.params.login,
            passwordHash: req.params.passwordHash,
            nickname: req.params.nickname,
        };
        
        if (!params.login || !params.passwordHash ) {
            return res.json(Answer.bad(242));
        }

        const response = await mediator.get(REGISTRATION, params);

        if (response && response.error) {
            return res.json(Answer.bad(response.error));
        }
        
        res.json(Answer.good(response));
    };
};