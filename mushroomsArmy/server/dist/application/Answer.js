"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Answer {
    constructor() {
        this.errors = {
            11: "Ошибка авторизации",
            13: "Передан неполный набор параметров",
            17: "Пользователь с данным именем уже зарегистрирован",
            9000: "Самая страшная ошибка, собирайте вещи и срочно уезжайте в лес пережидать",
        };
    }
    bad(code = 9000) {
        return {
            result: "error",
            error: {
                code,
                text: this.errors[code],
            },
        };
    }
    good(data) {
        if (!data) {
            return this.bad(); // Fallback to bad if no data
        }
        return {
            result: "ok",
            data,
        };
    }
}
exports.default = Answer;
//# sourceMappingURL=Answer.js.map