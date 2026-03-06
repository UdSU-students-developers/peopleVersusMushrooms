module.exports = (gameManager, answer) => {
    return (req, res) => {
        const { token, id, unitId } = req.body;

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!id || !unitId) {
            return res.send(answer.bad(13));
        }

        const result = gameManager.updateUnit(id, unitData);

        return res.send(result);
    }
}