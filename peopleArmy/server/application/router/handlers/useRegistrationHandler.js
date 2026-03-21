const Answer = require('../../Answer');

module.exports = (mediator) => {
    return async (req, res) => {
        const username = req.params.username;
        const password = req.params.password;
        const user = await mediator.get(mediator.TRIGGERS.REGISTER, { username, password });
        if (!user) {
            return res.status(409).json(Answer.bad(409));
        }
        res.json(Answer.good(user));
    };
};
