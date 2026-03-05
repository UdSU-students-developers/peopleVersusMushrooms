const Answer = require('../../Answer');

module.exports = (_, res) => {
    res.status(404).json(Answer.bad(404));
};