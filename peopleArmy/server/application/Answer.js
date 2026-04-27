const GlobalAnswer = require('../../../global/Answer');

class Answer extends GlobalAnswer {
    LOCAL_CODES = {
        400: "Неверные данные запроса",
        422: "Юнит с таким идентификатором уже существует",
    };

    /**
     * @param {number} code — код ошибки.
     * @returns {{ result: "error", error: string, code: number }}
     */
    bad(code) {
        const message = this.CODES[code] ?? this.LOCAL_CODES[code] ?? "Неизвестная ошибка";
        return {
            result: "error",
            error: message,
            code,
        };
    }

    /**
     * @param {*} data — данные для успешного ответа.
     * @returns {{ result: "ok", data: * } | { result: "error", error: string, code: number }}
     */
    good(data) {
        if (data === null) {
            return this.bad(9000);
        }
        return {
            result: "ok",
            data,
        };
    }
}

module.exports = Answer;
