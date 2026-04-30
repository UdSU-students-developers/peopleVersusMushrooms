module.exports = (mediator, answer) => {
    return (req, res) => {
        const { mapGuid, userGuid } = req.body;
        if (!mapGuid) {
            return res.send(answer.bad(3002));
        }
        const { GET_RELIEF_HANDLER } = mediator.getTriggerTypes();
		const relief = mediator.get(GET_RELIEF_HANDLER, { mapGuid, userGuid });
        if (!relief) {
            return res.send(answer.bad(3002));
        }
        res.send(answer.good({ map: relief }));
    }
}