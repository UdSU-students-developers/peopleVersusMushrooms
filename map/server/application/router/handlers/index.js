

const useUpdateUnitsHandler = require("./useUpdateUnitsHandler");
const useUpdateBuildingsHandler = require("./useUpdateBuildingsHandler");
const useGetVisibilityHandler = require("./useGetVisibilityHandler");
const useGetResourseVisibilityHandler = require("./useGetResourseVisibilityHandler");
const useGetGeneratedMapHandler = require("./useGetGeneratedMapHandler");

const useJoinToLobbyHandler = require("./useJoinToLobbyHandler");
const useGetLobbiesHandler = require("./useGetLobbiesHandler");
const useGetReliefHandler = require("./useGetReliefHandler");

module.exports = {
    //для http методов map
    useGetReliefHandler,
    useGetVisibilityHandler,
    useGetResourseVisibilityHandler,
    useGetGeneratedMapHandler,

    useUpdateUnitsHandler,
    useUpdateBuildingsHandler,

    //для http методов lobby
    useGetLobbiesHandler,
    useJoinToLobbyHandler,
};