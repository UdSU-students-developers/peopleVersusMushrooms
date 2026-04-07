const getVisibilityHandler = require("./getVisibilityHandler");
const getResourseVisibilityHandler = require("./getResourseVisibilityHandler");
const useGetLobbiesHandler = require("./useGetLobbiesHandler");
const useJoinToLobbyHandler = require("./useJoinToLobbyHandler");
const updateUnitsHandler = require("./updateUnitsHandler");
const getReliefHandler = require("./getReliefHandler");
const updateBuildingsHandler = require("./updateBuildingsHandler");

module.exports = {
    //для http методов map
    getReliefHandler,
    getVisibilityHandler,
    getResourseVisibilityHandler,

    updateUnitsHandler,
    updateBuildingsHandler,

    useGetLobbiesHandler,
    useJoinToLobbyHandler,
};