class Answer {
    errors = {
        11: "Ошибка авторизации",
        13: "Передан неполный набор параметров",
        17: "Пользователь с данным именем уже зарегистрирован",
        9000: "Самая страшная ошибка, собирайте вещи и срочно уезжайте в лес пережидать",
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
            return this.bad();
        }
        return {
            result: "ok",
            data,
        };
    }
}

module.exports = Answer;
