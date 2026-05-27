const Answer = require('../../Answer');
const answer = new Answer();

module.exports = (_, res) => {
    res.status(404).json(answer.bad(404));
};