module.exports = (userManager, answer) => {
    return async (data, socket) => {
        const { login, password, username } = data;

        if (!login || !password || !username) {
            socket.emit('registration', answer.bad(13));
        }

        const result = await userManager.registration(login, password, username);

        return socket.emit('registration', result);
    }
}