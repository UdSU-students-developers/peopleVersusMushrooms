const Answer = require('../../Answer');
new Answer();

module.exports = (_, res) => {
    res.status(404).json(Answer.bad(404));
};