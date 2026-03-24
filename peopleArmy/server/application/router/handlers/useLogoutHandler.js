const Answer = require('../../Answer');

module.exports = (mediator) => {
    return async (req, res) => {
        const { username } = req.params;
        const { token, guid } = req.query;

        const result = await mediator.get(mediator.TRIGGERS.LOGOUT, { username, token, guid });
        if (!result) {
            return res.status(401).json(Answer.bad(11));
        }

        res.json(Answer.good(true));
    };
};
