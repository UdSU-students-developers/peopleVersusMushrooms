module.exports = (gameManager, answer) => {
    return (req, res) => {
        const { token, unitData } = req.body;

        if (!token) {
            return res.json(answer.bad(11));
        }

        if (!unitData) {
            return res.json(answer.bad(13));
        }

        const result = gameManager.createUnit(unitData);

        return res.json(result);
    }
}