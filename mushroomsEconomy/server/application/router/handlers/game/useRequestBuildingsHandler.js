module.exports = (mediator, answer) => {
    const { REQUEST_BUILDINGS } = mediator.getEventTypes();
    return (req, res) => {

        const options = {
            mushroomsEconomy,
            buildingsType,
            buildingsAmount,
        } = req.body;

        if (!options.mushroomsEconomy || !options.buildingsType || !options.buildingsAmount) {
            return res.send(answer.bad(242));
        }

        const response = mediator.call(REQUEST_BUILDINGS, options);

        if (response?.result) {
            return res.send(response);
        }

        return res.send(answer.bad(9000));
    };
};
