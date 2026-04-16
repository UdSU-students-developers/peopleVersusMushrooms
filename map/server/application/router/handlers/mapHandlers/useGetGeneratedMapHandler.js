const useGetGeneratedMapHandler = (mediator, answer, common) => {
    const { GET_GENERATED_MAP } = mediator.getTriggerTypes();
    return (req, res) => {
        res.json(answer.good(mediator.get(GET_GENERATED_MAP, { mapGuid, userGuid, units })));
    }
}

module.exports = useGetGeneratedMapHandler;