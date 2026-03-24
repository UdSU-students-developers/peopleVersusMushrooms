const Answer = require('../../Answer');

module.exports = (mediator) => {
    return async (req, res) => {
        const { username, password } = req.params;
        const user = await mediator.get(mediator.TRIGGERS.LOGIN, { username, password });
        if (!user) {
            return res.status(401).json(Answer.bad(11));
        }

        res.json(Answer.good(user));
    };
};
