module.exports = (mediator, answer) => {
    return (req, res) => {
        const { guid, targetX, targetY } = req.params;
        const result = mediator.get(mediator.TRIGGERS.SET_UNIT_TARGET, {
            guid,
            targetX,
            targetY,
        });
        if (!result?.ok) {
            if (result?.error === 'UNIT_NOT_FOUND') {
                return res.status(404).json(answer.bad(404));
            }
            return res.status(400).json(answer.bad(400));
        }
        console.log('setUnitTargetHandler', guid, targetX, targetY);
        res.json(answer.good(result.data));
    };
};
