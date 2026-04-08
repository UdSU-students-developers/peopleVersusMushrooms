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
        if (result?.result === 'error') {
            console.log('CREATE_UNIT error:', result);
            return res.status(400).json(result);
        }
        console.log('createUnitHandler', guid, x, y, type);
        res.json(result || answer.bad(9000));
    };
};
