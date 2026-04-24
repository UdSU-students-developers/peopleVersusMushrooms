const GlobalAnswer = require('../../../global/Answer');
class Answer extends GlobalAnswer {
    constructor() {
        super();
        Object.assign(this.CODES, {
            400: 'Неверные данные запроса',
            422: 'Юнит с таким идентификатором уже существует',
        });
    }
}

module.exports = Answer;
