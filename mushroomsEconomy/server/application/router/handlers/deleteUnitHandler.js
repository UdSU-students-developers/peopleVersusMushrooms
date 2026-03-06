module.exports = (gameManager, answer) => {
    return (req, res) => {
        const { token, id } = req.body;

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!id) {
            return res.send(answer.bad(13));
        }

        const result = gameManager.deleteUnit(id);

        return res.send(result);
    }
}