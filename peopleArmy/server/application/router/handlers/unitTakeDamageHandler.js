module.exports = (mediator, answer) => {
    return (req, res) => {
        const { guid, damage } = req.params;
        const result = mediator.get(mediator.TRIGGERS.UNIT_TAKE_DAMAGE, {
            guid,
            damage,
        });
        
        if (!result?.ok) {
            console.log('UNIT_TAKE_DAMAGE error:', result);
            return res.status(400).json(answer.bad(400));
        }
        console.log('unitTakeDamageHandler', guid, damage);
        res.json(answer.good(result.data));
    };
};
