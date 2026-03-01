module.exports = (mediator, Answer) => {
    const { TEST } = mediator.getTriggerTypes();

    return async (req, res) => {
        const params = {
            data1: req.params.data1,
            data2: req.params.data2,
        };
        
        if (!params.data1 || !params.data2 ) {
            return res.json(Answer.bad(242));
        }

        const response = await mediator.get(TEST, params);
        
        res.json(Answer.good(response));
    };
};
