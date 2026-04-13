module.exports = (mediator, answer) => {
    return (req, res) => {
        const { lobbies } = req.body;
		if (!lobbies) {
			return res.send(answer.bad(1004));
		}
		const { LOBBY_UPDATED } = mediator.getEventTypes();
		mediator.call(LOBBY_UPDATED, lobbies);
        return res.send(answer.good(true));
    }
}