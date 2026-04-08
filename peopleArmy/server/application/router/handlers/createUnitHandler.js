module.exports = (mediator, answer) => {
    return (req, res) => {
        const { guid, x, y } = req.params;
        const type = req.query.type;
        const result = mediator.get(mediator.TRIGGERS.CREATE_UNIT, {
            guid,
            x,
            y,
            type,
        });
        if (!result?.ok) {
            console.log('CREATE_UNIT error:', result);
            return res.status(400).json(answer.bad(400));
        }
        console.log('createUnitHandler', guid, x, y, type);
        res.json(answer.good(result.data));
    };
};
