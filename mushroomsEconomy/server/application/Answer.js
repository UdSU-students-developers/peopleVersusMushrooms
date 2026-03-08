class Answer {
    errors = {
        11: "Ошибка авторизации",
        12: "Mushroom с данным id не найден",
        13: "Переданы неполный набор параметров",
        14: "Unit с данным id не найден",
        15: "Некорректная матрица",
        9000: "Самая страшная ошибка, собирайте вещи и срочно уезжайте в лес пережидать",
    }
    
    bad(error) {
        return this.errors[error];
    }

    good(data) {
        if (!data) {
            return this.error(9000);
        }
        return {
            result: "ok",
            data,
        };
    }
}

module.exports = Answer;