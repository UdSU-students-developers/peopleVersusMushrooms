const getResourseVisibilityHandler = (mediator, answer, common) => {
    const { GET_RESOURSE_VISIBILITY_HANDLER } = mediator.getTriggerTypes();

    return (req, res) => {
        const { mapGuid, userGuid, visibilityJSON } = req.params;
        //проверка гуидов
        if (!(common.checkGuid(mapGuid) && common.checkGuid(userGuid))) {
            return res.json(answer.bad(3001));
        }
        //проверить visibility (что это массив из пар чисел)
        let visibility = null;
        try {
            visibility = JSON.parse(visibilityJSON);
        } catch (e) {
            return res.json(answer.bad(3002)) 
        }
        if (!(Array.isArray(visibility))) {
            return res.json(answer.bad(3002))
        }
        visibility.forEach(tile => {
            if (!(
                tile.length() === 2 && 
                Number.isInteger(tile[0] + tile[1])
            )) {
                return res.json(answer.bad(3002));
            }
        });
        res.json(mediator.get(GET_RESOURSE_VISIBILITY_HANDLER, { mapGuid, userGuid, visibility}));
    }
}

module.exports = getResourseVisibilityHandler;