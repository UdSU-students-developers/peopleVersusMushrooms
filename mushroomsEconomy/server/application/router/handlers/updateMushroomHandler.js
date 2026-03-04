module.exports = (gameManager, answer) => {
    return (req, res) => {
        const { token, id, mushroomData } = req.body;

        if (!token) {
            return res.send(answer.bad(11));
        }

        if (!id || !mushroomData) {
            return res.send(answer.bad(13));
        }

        const result = gameManager.updateMushroom(id, mushroomData);

        return res.send(result);
    }
}