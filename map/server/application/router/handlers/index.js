const useUpdateUnitsHandler = require("./mapHandlers/useUpdateUnitsHandler");
const useUpdateBuildingsHandler = require("./mapHandlers/useUpdateBuildingsHandler");
const useGetVisibilityHandler = require("./mapHandlers/useGetVisibilityHandler");
const useGetResourseVisibilityHandler = require("./mapHandlers/useGetResourseVisibilityHandler");
const useGetGeneratedMapHandler = require("./mapHandlers/useGetGeneratedMapHandler");
const useGetReliefHandler = require ("./mapHandlers/useGetReliefHandler");

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