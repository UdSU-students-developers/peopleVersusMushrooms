module.exports = (mediator, answer, common) => {
    const { START_GAME } = mediator.getEventTypes();

    return async (req, res) => {

        console.log('ЙА жЫвой!!!');

        /*
        const { guid } = req.params;
        if (!common.checkGuid(guid)) {
            return res.json(answer.bad(242));
        }
        const response = await mediator.call(START_GAME, { guid });
        if (response && response.error) {
            return res.json(answer.bad(response.error));
        }
        */
        
        res.json(answer.good(response));
    };
};