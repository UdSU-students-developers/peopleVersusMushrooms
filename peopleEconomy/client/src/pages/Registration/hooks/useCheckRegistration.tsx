import { useCallback, useState } from "react";

const useChecRegistration = () => {
    const [isFormValid, setIsFormValid] = useState(false);
    const [clientError, setClientError] = useState<string>('');

    const checkFilled = useCallback((login: string, password: string, confirmPassword: string) => {
        const isFilled = login.trim().length > 0 && password.trim().length > 0 && confirmPassword.trim().length > 0;
        setIsFormValid(isFilled);
    }, []);

    const checkValidChars = /^[a-zA-Z0-9]+$/;

    const showError = useCallback((login: string, password: string, confirmPassword: string): boolean => {
        if (login.length > 15 || login.length < 6) {
            setClientError("логин должен быть от 6 до 15 символов");
            return false;
        }
        else if (!checkValidChars.test(login)) {
            setClientError('логин должен содержать только латинские буквы и цифры');
            return false;
        }
        else if (password.length > 25 || password.length < 6) {
            setClientError('пароль должен быть от 6 до 25 символов');
            return false;
        }
        else if (!checkValidChars.test(password)) {
            setClientError('пароль должен содержать только латинские буквы и цифры');
            return false;

        }
        else if (password !== confirmPassword) {
            setClientError('пароли не совпадают');
            return false;
        }

        return true;
    }, []);

    return {
        isFormValid,
        clientError,
        setClientError,
        checkFilled,
        showError
    };
}

export default useChecRegistration;