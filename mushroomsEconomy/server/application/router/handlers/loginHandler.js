module.exports = (userManager, answer) => {
    return async (data, socket) => {
        const { login, password } = data;

        if (!login || !password) {
            socket.emit('login', answer.bad(13));
        }

        const result = await userManager.login(login, password);

        socket.emit('login', result);
    }
}