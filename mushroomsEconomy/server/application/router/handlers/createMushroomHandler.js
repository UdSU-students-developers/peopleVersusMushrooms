module.exports = (gameManager, answer) => {
    return (req, res) => {
        const { token, mushroomData } = req.body;

        if (!token) {
            return res.json(answer.bad(11));
        }

        if (!mushroomData) {
            return res.json(answer.bad(13));
        }

        const result = gameManager.createMushroom(mushroomData);

        return res.json(result);
    }
}