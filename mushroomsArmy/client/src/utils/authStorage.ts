import { TUser } from '../services/server/types';

export const authStorage = {
    setAuth: (token: string, user: TUser) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    getAuth: () => {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        return {
            token: token,
            user: userString ? JSON.parse(userString) : null
        };
    },

    setCredentials: (name: string, passwordHash: string) => {
        localStorage.setItem('credentials', JSON.stringify({ name, passwordHash }));
    },

    getCredentials: (): { name: string; passwordHash: string } | null => {
        const raw = localStorage.getItem('credentials');
        return raw ? JSON.parse(raw) : null;
    },

    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('credentials');
    }
};