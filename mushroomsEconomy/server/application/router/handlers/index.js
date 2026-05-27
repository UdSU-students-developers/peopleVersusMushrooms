const notFoundHandler = require("./notFoundHandler");
const useLobbyUpdatedHandler = require('./lobby/useLobbyUpdatedHandler');
const useStartGameHandler = require('./game/useStartGameHandler');
const useDamageHandler = require('./game/useDamageHandler');
const useRequestUnitsHandler = require('./game/useRequestUnitsHandlers');
const useRequestBuildingsHandler = require('./game/useRequestBuildingsHandler');

module.exports = {
    notFoundHandler,
    useLobbyUpdatedHandler,
    useStartGameHandler,
    useDamageHandler,
    useRequestUnitsHandler,
    useRequestBuildingsHandler,
};