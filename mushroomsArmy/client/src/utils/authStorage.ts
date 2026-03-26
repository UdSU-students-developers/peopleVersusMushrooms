export const authStorage = {
    setAuth: (token: string, user: any) => {

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

    },


    getAuth: () => {
        const token = localStorage.getItem('token');
        const userString = localStorage.getItem('user');
        
        return {
            token: token,
            user: userString ? JSON.parse(userString) : null //(userString) в ОБЪЕКТ (user)
        };
    },

    
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};