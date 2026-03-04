module.exports = (gameManager, answer) => {
    return (req, res) => {
        const { token, newMatrix } = req.body;

        if (!token) {
            return res.json(answer.bad(11));
        }

        if (!newMatrix) {
            return res.json(answer.bad(13));
        }

        const result = gameManager.setMatrix(newMatrix);

        return res.json(result);
    }
}