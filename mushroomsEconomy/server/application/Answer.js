class Answer {
    errors = {
        11: "Ошибка авторизации",
        12: "Mushroom с данным id не найден",
        13: "Передан неполный набор параметров",
        14: "Unit с данным id не найден",
        15: "Некорректная матрица",
        16: "Пользователя с данным именем не существует",
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