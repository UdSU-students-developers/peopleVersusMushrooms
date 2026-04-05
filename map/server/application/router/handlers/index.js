const getVisibilityHandler = require("./getVisibilityHandler");
const getResourseVisibilityHandler = require("./getResourseVisibilityHandler");
const updateEconomyUnitsHandler = require("./updateEconomyUnitsHandler");
const useGetLobbiesHandler = require("./useGetLobbiesHandler");
const useJoinToLobbyHandler = require("./useJoinToLobbyHandler");

module.exports = {
    //для http методов map
    getVisibilityHandler,
    getResourseVisibilityHandler,
    updateEconomyUnitsHandler,

    useGetLobbiesHandler,
    useJoinToLobbyHandler,
};