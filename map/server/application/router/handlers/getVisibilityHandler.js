const getVisibilityHandler = (mediator, answer) => {
    const { GET_VISIBILITY_HANDLER } = mediator.getTriggerType();

    return (req, res) => {
        const {mapGuid, userGuid} = req.params;

        //проверить guid-ы
        //проверить visibility (что это массив из пар чисел)

        res.json(mediator.get(GET_VISIBILITY_HANDLER, { mapGuid, userGuid, visibility}));
    }
}

module.exports = getVisibilityHandler;