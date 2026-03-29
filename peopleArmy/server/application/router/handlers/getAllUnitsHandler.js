const Answer = require('../../Answer');

module.exports = (mediator) => {
    return (_req, res) => {
        const result = mediator.get(mediator.TRIGGERS.GET_ALL_UNITS);
        if (!result?.ok) {
            return res.status(400).json(Answer.bad(400));
        }
        console.log('getAllUnitsHandler');
        res.json(Answer.good(result.data));
    };
};
