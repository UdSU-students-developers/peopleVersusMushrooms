module.exports = (mediator, answer) => {
    return (req, res) => {
        const { userGuid, unitGuid, x, y } = req.body || {};
        const result = mediator.get(mediator.TRIGGERS.MOVE_UNIT, {
            userGuid,
            unitGuid,
            x,
            y,
        });
        if (result?.result === 'error') {
            console.log('MOVE_UNIT error:', result);
            return res.status(400).json(result);
        }
        console.log('unitMoveHandler', userGuid, unitGuid, x, y);
        res.json(result || answer.bad(9000));
    };
};
