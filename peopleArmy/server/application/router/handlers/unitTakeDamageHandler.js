module.exports = (mediator, answer) => {
    return (req, res) => {
        const { guid, damage } = req.params;
        const result = mediator.get(mediator.TRIGGERS.UNIT_TAKE_DAMAGE, {
            guid,
            damage,
        });
        
        if (result?.result === 'error') {
            console.log('UNIT_TAKE_DAMAGE error:', result);
            return res.status(400).json(result);
        }
        console.log('unitTakeDamageHandler', guid, damage);
        res.json(result || answer.bad(9000));
    };
};
