import { TUser } from "../server/types";

const TOKEN = 'token';

class Store {
    [key: string]: any;
    private user: TUser | null = null;

    setUser(user: TUser): void {
        this.user = user;
        // Сохраняем токен в localStorage для сохранения сессии
        localStorage.setItem('user_token', user.token);
        localStorage.setItem('user_name', user.name);
        if (user.id) {
            localStorage.setItem('user_id', user.id.toString());
        }
    }

    getUser(): TUser | null {
        // Если пользователь есть в памяти - возвращаем его
        if (this.user) {
            return this.user;
        }

        // Иначе пробуем восстановить из localStorage
        const token = localStorage.getItem('user_token');
        const name = localStorage.getItem('user_name');
        const id = localStorage.getItem('user_id');

        if (token && name) {
            this.user = {
                token,
                name,
                id: id ? parseInt(id) : undefined
            };
            return this.user;
        }

        return null;
    }

    getToken(): string | null {
        return this.user?.token || localStorage.getItem('user_token');
    }

    clearUser(): void {
        this.user = null;
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_id');
    }
}

export default Store;