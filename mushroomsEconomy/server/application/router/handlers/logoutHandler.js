module.exports = (userManager, answer) => {
    return async (data, socket) => {
        const { token } = data;

        if (!token) {
            socket.emit('logout', answer.bad(13));
        }

        const result = await userManager.logout(token);

        socket.emit('logout', result);
    }
}