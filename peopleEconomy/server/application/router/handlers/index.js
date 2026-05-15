const notFoundHandler = require("./notFoundHandler");
const useLobbyUpdatedHandler = require('./lobby/useLobbyUpdatedHandler');
const useStartGameHandler = require('./game/useStartGameHandler');
const useDamageHandler = require('./game/useDamageHandler');

module.exports = {
    notFoundHandler,
    useLobbyUpdatedHandler,
    useStartGameHandler,
    useDamageHandler,
};