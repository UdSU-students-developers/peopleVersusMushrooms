class Answer {
    errors = {
        11: "Ошибка авторизации",
        13: "Отсутствуют обязательные параметры (name/password/token)",
        17: "Пользователь с таким именем уже существует",
        400: "Неверные данные запроса",
        404: "Не найдено",
        503: "Сервис временно недоступен",
        409: "Пользователь с таким именем уже существует",
        422: "Юнит с таким идентификатором уже существует",
        9000: "Ошибка сервера",
    };

    /**
     * @param {number} code — код ошибки (ключ из this.errors).
     * @returns {{ result: "error", error: string, code: number }}
     */
    bad(code) {
        return {
            result: "error",
            error: this.errors[code] || "Неизвестная ошибка",
            code,
        };
    }

    /**
     * @param {*} data — данные для успешного ответа.
     * @returns {{ result: "ok", data: * }} или объект ошибки, если data нет.
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