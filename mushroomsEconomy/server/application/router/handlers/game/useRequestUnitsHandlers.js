module.exports = (mediator, answer) => {
    const { REQUEST_UNITS } = mediator.getEventTypes();

    return (req, res) => {

        const options = {
            userGuid,
            unitsType,
            unitsAmount,
        } = req.body;

        if (!options.userGuid || !options.unitsType || !options.unitsAmount) {
            return res.send(answer.bad(242));
        }
        
        const response = mediator.call(REQUEST_UNITS, {options});

        if (response && response.error) {
            return res.send(answer.bad(response.error));
        }
        
        res.send(answer.good(response));
    };
};