module.exports = (mediator, answer) => {
    return (req, res) => {
        const { userGuid, unitGuid, damage } = req.params;
        const result = mediator.get(mediator.TRIGGERS.UNIT_TAKE_DAMAGE, {
            userGuid,
            unitGuid,
            damage,
        });
        
        if (result?.result === 'error') {
            console.log('UNIT_TAKE_DAMAGE error:', result);
            return res.status(400).json(result);
        }
        console.log('unitTakeDamageHandler', userGuid, unitGuid, damage);
        res.json(result || answer.bad(9000));
    };
};
