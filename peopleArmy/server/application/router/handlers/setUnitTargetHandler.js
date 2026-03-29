const Answer = require('../../Answer');

module.exports = (mediator) => {
    return async (req, res) => {
        const { guid, targetX, targetY } = req.params;
        const result = await Promise.resolve(mediator.get(mediator.TRIGGERS.SET_UNIT_TARGET, {
            guid,
            targetX,
            targetY,
        }));
        if (!result?.ok) {
            if (result?.error === 'UNIT_NOT_FOUND') {
                return res.status(404).json(Answer.bad(404));
            }
            return res.status(400).json(Answer.bad(400));
        }
        console.log('setUnitTargetHandler', guid, targetX, targetY);
        res.json(Answer.good(result.data));
    };
};
