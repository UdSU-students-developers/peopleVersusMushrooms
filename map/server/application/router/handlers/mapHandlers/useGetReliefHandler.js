const useGetReliefHandler = (mediator, answer, common) => {
    const { GET_RELIEF_HANDLER } = mediator.getTriggerTypes();

    return (req, res) => {
        const { mapGuid, userGuid } = req.body;
        //проверка гуидов
        if (!(common.checkGuid(mapGuid) && common.checkGuid(userGuid))) {
            return res.json(answer.bad(3001));
        }
        
        res.json(answer.good(mediator.get(GET_RELIEF_HANDLER, { mapGuid, userGuid })));
    }
}

module.exports = useGetReliefHandler;