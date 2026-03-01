class Answer {
    CODES = {
        //test error
        1001: 'Такого пользака нет',
        //main errors
        242: 'Не переданы все необходимые параметры',
        404: 'NOT FOUND',
        //other
        9000: 'Неизвестная ошибка',
    };

     bad(code) {
        return {
            result: "error",
            code,
            message: this.CODES[code],
        };
    }

    good(data) {
        if (!data) {
            return this.bad(9000);
        }
        return {
            result: "ok",
            data,
        };
    }
}

module.exports = new Answer;