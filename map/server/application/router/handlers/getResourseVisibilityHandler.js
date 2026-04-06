const getResourseVisibilityHandler = (mediator, answer, common) => {
    const { GET_RESOURSE_VISIBILITY_HANDLER } = mediator.getTriggerTypes();

    return (req, res) => {
        const { mapGuid, userGuid } = req.params;
        //проверка гуидов
        if (!(common.checkGuid(mapGuid) && common.checkGuid(userGuid))) {
            return res.json(answer.bad(3001));
        }
        res.json(mediator.get(GET_RESOURSE_VISIBILITY_HANDLER, { mapGuid, userGuid }));
    }
}

module.exports = getResourseVisibilityHandler;