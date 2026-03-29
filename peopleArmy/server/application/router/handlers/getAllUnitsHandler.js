module.exports = (mediator, answer) => {
    return (req, res) => {
        const result = mediator.get(mediator.TRIGGERS.GET_ALL_UNITS, {
            ownerGuid: req.query.ownerGuid,
            userGuid: req.query.userGuid,
        });
        if (!result?.ok) {
            return res.status(400).json(answer.bad(400));
        }
        console.log('getAllUnitsHandler');
        res.json(answer.good(result.data));
    };
};
