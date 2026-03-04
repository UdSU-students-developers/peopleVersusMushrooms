module.exports = (gameManager, answer) => {
    return (req, res) => {
        const { token, newMatrix } = req.body;

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!newMatrix) {
            return res.send(answer.bad(13));
        }

        const result = gameManager.setMatrix(newMatrix);

        return res.send(result);
    }
}