module.exports = (gameManager, answer) => {
    return (req, res) => {
        const { token } = req.body;

        if (!token) {
            return res.send(answer.bad(11));
        }

        const result = gameManager.getAllUnits();

        return res.send(result);
    }
}