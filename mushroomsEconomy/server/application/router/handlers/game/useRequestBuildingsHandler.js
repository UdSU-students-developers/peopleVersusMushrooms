module.exports = (mediator, answer) => {
    const { REQUEST_BUILDINGS } = mediator.getEventTypes();

    return (req, res) => {

        const options = {
            userGuid,
            buildingsType,
            buildingsAmount,
        } = req.body;

        if (!options.userGuid || !options.buildingsType || !options.buildingsAmount) {
            return res.send(answer.bad(242));
        }

        const response = mediator.call(REQUEST_BUILDINGS, { options });

        if (response && response.error) {
            return res.send(answer.bad(response.error));
        }

        res.send(answer.good(response));
    };
};