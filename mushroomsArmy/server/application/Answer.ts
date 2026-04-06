type TErrorMessages = {
    [key: number]: string;
}

type TBadResponse = {
    result: "error";
    error: {
        code: number;
        text: string;
    };
}

type TGoodResponse<T> = {
    result: "ok";
    data: T;
}

export type TResponse<T> = TGoodResponse<T> | TBadResponse;

class Answer {
    private errors: TErrorMessages = {
        10: "Токен истёк или недействителен",
        11: "Ошибка авторизации",
        13: "Передан неполный набор параметров",
        17: "Пользователь с данным именем уже зарегистрирован",
        18: "Логин не соответствует формату",
        19: "Пароль не соответствует требованиям",
        20: "Пароли не совпадают",
        9000: "Самая страшная ошибка, собирайте вещи и срочно уезжайте в лес пережидать",
    };

    bad(code: number = 9000): TBadResponse {
        return {
            result: "error",
            error: {
                code,
                text: this.errors[code],
            },
        };
    }

    good<T>(data: T): TResponse<T> {
        if (!data) {
            return this.bad();
        }
        return {
            result: "ok",
            data,
        };
    }
}

export default Answer;
