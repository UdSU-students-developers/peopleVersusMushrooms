module.exports = (mediator, answer) => {
    return async (req, res) => {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.send(answer.bad(13));
        }
        
        res.send(answer.good("Reg"));
    };
};