const useUpdateUnitsHandler = require("./useUpdateUnitsHandler");
const useUpdateBuildingsHandler = require("./useUpdateBuildingsHandler");
const useGetVisibilityHandler = require("./useGetVisibilityHandler");
const useGetResourseVisibilityHandler = require("./useGetResourseVisibilityHandler");
const useGetGeneratedMapHandler = require("./useGetGeneratedMapHandler");
const useGetReliefHandler = require ("./useGetReliefHandler");

const useCreateLobbyHandler = require("./lobbyHandlers/useCreateLobbyHandler");
const useJoinToLobbyHandler = require("./lobbyHandlers/useJoinToLobbyHandler");
const useLeaveLobbyHandler = require("./lobbyHandlers/useLeaveLobbyHandler");
const useDropFromLobbyHandler= require("./lobbyHandlers/useDropFromLobbyHandler");
const useStartGameHandler = require("./lobbyHandlers/useStartGameHandler");
const useGetLobbiesHandler = require("./lobbyHandlers/useGetLobbiesHandler");
const useSetReadyHandler = require("./lobbyHandlers/useSetReadyHandler");

module.exports = {
    //для http методов map
    useGetReliefHandler,
    useGetVisibilityHandler,
    useGetResourseVisibilityHandler,
    useGetGeneratedMapHandler,

    useUpdateUnitsHandler,
    useUpdateBuildingsHandler,

    //для http методов lobby
    useCreateLobbyHandler,
    useJoinToLobbyHandler,
    useLeaveLobbyHandler,
    useDropFromLobbyHandler,
    useStartGameHandler,
    useGetLobbiesHandler,
    useSetReadyHandler,

};