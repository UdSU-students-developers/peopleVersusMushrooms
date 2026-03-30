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
            if (result?.error === 'DUPLICATE_GUID') {
                return res.status(422).json(answer.bad(422));
            }
            if (result?.error === 'ARMY_NOT_FOUND') {
                return res.status(404).json(answer.bad(404));
            }
            if (result?.error === 'UNIT_TYPES_NOT_READY' || result?.error === 'UNIT_TYPES_LOAD_FAILED') {
                return res.status(503).json(answer.bad(503));
            }
            return res.status(400).json(answer.bad(400));
        }
        console.log('createUnitHandler', guid, x, y, type);
        res.json(answer.good(result.data));
    };
};
