const Answer = require('../../Answer');

module.exports = (mediator) => {
    return async (req, res) => {
        const { guid, x, y } = req.params;
        const type = req.query.type;
        const result = await Promise.resolve(mediator.get(mediator.TRIGGERS.CREATE_UNIT, {
            guid,
            x,
            y,
            type,
        }));
        if (!result?.ok) {
            if (result?.error === 'DUPLICATE_GUID') {
                return res.status(422).json(Answer.bad(422));
            }
            return res.status(400).json(Answer.bad(400));
        }
        console.log('createUnitHandler', guid, x, y, type);
        res.json(Answer.good(result.data));
    };
};
