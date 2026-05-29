module.exports = (mediator, answer) => {
    const { REQUEST_UNITS } = mediator.getEventTypes();

    return (req, res) => {

        const options = {
            mushroomsEconomy,
            unitsType,
            unitsAmount,
        } = req.body;

        if (!options.mushroomsEconomy || !options.unitsType || !options.unitsAmount) {
            return res.send(answer.bad(242));
        }
        
        const response = mediator.call(REQUEST_UNITS, options);

        if (response?.result) {
            return res.send(response);
        }

        return res.send(answer.bad(9000));
    };
};
