interface ErrorMessages {
    [key: number]: string;
}

interface BadResponse {
    result: "error";
    error: {
        code: number;
        text: string;
    };
}

interface GoodResponse<T = any> {
    result: "ok";
    data: T;
}

class Answer {
    private errors: ErrorMessages = {
        11: "Ошибка авторизации",
        13: "Передан неполный набор параметров",
        17: "Пользователь с данным именем уже зарегистрирован",
        9000: "Самая страшная ошибка, собирайте вещи и срочно уезжайте в лес пережидать",
    };

    bad(code: number = 9000): BadResponse {
        return {
            result: "error",
            error: {
                code,
                text: this.errors[code],
            },
        };
    }

    good<T>(data: T): GoodResponse<T> {
        if (!data) {
            return this.bad() as any; // Fallback to bad if no data
        }
        return {
            result: "ok",
            data,
        };
    }
}

export default Answer;