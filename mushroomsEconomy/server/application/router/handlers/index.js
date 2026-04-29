const notFoundHandler = require("./notFoundHandler");
const useLobbyUpdatedHandler = require('./lobby/useLobbyUpdatedHandler');
const useStartGameHandler = require('./game/useStartGameHandler');
const useGrowLarvaHandler = require('./game/useGrowLarvaHandler')

module.exports = {
    notFoundHandler,
    useLobbyUpdatedHandler,
    useStartGameHandler,
    useGrowLarvaHandler,
};