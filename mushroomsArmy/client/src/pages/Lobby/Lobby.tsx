import React, { useContext, useEffect, useState } from "react";
import { MediatorContext, ServerContext } from "../../App";
import { PAGES } from '../PageManager';
import { authStorage } from "../../utils/authStorage";
import { ILobby, TUser } from "../../services/server/types";
import './Lobby.css';

type TLobbyRole = keyof ILobby['playersGuids'];

const Lobby: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);

    const GET_STORE = mediator.getTriggerTypes().GET_STORE;
    const {
        USER_LOGGED_OUT,
        GAME_STARTED,
        LOBBY_UPDATED,
        LOBBYS_LIST_UPDATED,
        CREATE_LOBBY,
        JOIN_TO_LOBBY,
        LEAVE_LOBBY,
        SET_READY,
        DROP_FROM_LOBBY,
    } = mediator.getEventTypes();

    const user = mediator.get(GET_STORE, 'user') as TUser | null;

    const [lobbies, setLobbies] = useState<ILobby[]>([]);
    const [currentLobby, setCurrentLobby] = useState<ILobby | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [selectedRole, setSelectedRole] = useState<TLobbyRole>('spectator');
    const [newLobbyName, setNewLobbyName] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const isCreator =
        Boolean(user?.guid) &&
        Boolean(currentLobby?.lobbyGuid) &&
        user!.guid === currentLobby!.lobbyGuid;

    const allReady = (() => {
        if (!currentLobby) return false;
        const roles = Object.keys(currentLobby.playersGuids) as TLobbyRole[];
        return roles
            .filter((role) => currentLobby.playersGuids[role] !== null)
            .every((role) => currentLobby.playersIsReady[role] === true);
    })();

    useEffect(() => {
        let isCancelled = false;

        (async () => {
            try {
                const data = await server.getLobbies();
                if (!isCancelled) setLobbies(data);
            } catch {
                if (!isCancelled) setLobbies([]);
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [server]);

    useEffect(() => {
        let isCancelled = false;

        const syncLobbyFromList = async () => {
            try {
                const data = await server.getLobbies();
                if (isCancelled) return;
                setLobbies(data);

                if (!user?.guid) return;
                const joinedLobby = data.find((lobby) =>
                    Object.values(lobby.playersGuids).includes(user.guid as string)
                );
                setCurrentLobby(joinedLobby ?? null);
            } catch {
                if (!isCancelled) setLobbies([]);
            }
        };

        const handleLoggedOut = () => {
            authStorage.clearAuth();
            setPage(PAGES.LOGIN);
        };

        const handleGameStarted = () => {
            setPage(PAGES.GAME);
        };

        const handleLobbyUpdated = (data?: unknown) => {
            const lobby = data as ILobby | null | undefined;
            if (!lobby) return;

            setCurrentLobby(lobby);

            const myGuid = user?.guid;
            if (!myGuid) return;

            const roles = Object.keys(lobby.playersGuids) as TLobbyRole[];
            const myRole = roles.find((role) => lobby.playersGuids[role] === myGuid);
            if (!myRole) return;

            setSelectedRole(myRole);
            setIsReady(Boolean(lobby.playersIsReady?.[myRole]));
        };

        const handleLobbiesListUpdated = (data?: unknown) => {
            const list = data as ILobby[] | null | undefined;
            if (!Array.isArray(list)) return;
            setLobbies(list);
        };

        const handleCreateLobby = async () => {
            await syncLobbyFromList();
        };

        const handleJoinToLobby = async () => {
            await syncLobbyFromList();
        };

        const handleLeaveLobby = () => {
            setCurrentLobby(null);
            setIsReady(false);
        };

        const handleSetReady = async (data?: unknown) => {
            // На сервере может приходить boolean; актуальная комната обычно прилетает через LOBBY_UPDATED.
            const lobby = data as ILobby | null | undefined;
            if (lobby?.lobbyGuid) setCurrentLobby(lobby);
            await syncLobbyFromList();
        };

        const handleDropFromLobby = async (data?: unknown) => {
            const lobby = data as ILobby | null | undefined;
            if (lobby?.lobbyGuid) setCurrentLobby(lobby);
            await syncLobbyFromList();
        };

        mediator.subscribe(USER_LOGGED_OUT, handleLoggedOut);
        mediator.subscribe(GAME_STARTED, handleGameStarted);
        mediator.subscribe(LOBBY_UPDATED, handleLobbyUpdated);
        mediator.subscribe(LOBBYS_LIST_UPDATED, handleLobbiesListUpdated);
        mediator.subscribe(CREATE_LOBBY, handleCreateLobby);
        mediator.subscribe(JOIN_TO_LOBBY, handleJoinToLobby);
        mediator.subscribe(LEAVE_LOBBY, handleLeaveLobby);
        mediator.subscribe(SET_READY, handleSetReady);
        mediator.subscribe(DROP_FROM_LOBBY, handleDropFromLobby);

        return () => {
            isCancelled = true;
            mediator.unsubscribe(USER_LOGGED_OUT, handleLoggedOut);
            mediator.unsubscribe(GAME_STARTED, handleGameStarted);
            mediator.unsubscribe(LOBBY_UPDATED, handleLobbyUpdated);
            mediator.unsubscribe(LOBBYS_LIST_UPDATED, handleLobbiesListUpdated);
            mediator.unsubscribe(CREATE_LOBBY, handleCreateLobby);
            mediator.unsubscribe(JOIN_TO_LOBBY, handleJoinToLobby);
            mediator.unsubscribe(LEAVE_LOBBY, handleLeaveLobby);
            mediator.unsubscribe(SET_READY, handleSetReady);
            mediator.unsubscribe(DROP_FROM_LOBBY, handleDropFromLobby);
        };
    }, [
        mediator,
        setPage,
        server,
        user?.guid,
        USER_LOGGED_OUT,
        GAME_STARTED,
        LOBBY_UPDATED,
        LOBBYS_LIST_UPDATED,
        CREATE_LOBBY,
        JOIN_TO_LOBBY,
        LEAVE_LOBBY,
        SET_READY,
        DROP_FROM_LOBBY,
    ]);

    const handleCreateLobby = () => {
        setIsCreateModalOpen(true);
        setNewLobbyName('');
    };

    const handleConfirmCreateLobby = () => {
        const lobbyName = newLobbyName.trim();
        if (!lobbyName) return;
        server.createLobby({ lobbyName, role: selectedRole });
        setIsCreateModalOpen(false);
        setNewLobbyName('');
    };

    const handleJoinLobby = (lobbyGuid: string) => {
        server.joinToLobby({ lobbyGuid, role: selectedRole });
    };

    const handleLeaveLobby = () => {
        setIsReady(false);
        server.leaveLobby();
    };

    const handleToggleReady = () => {
        server.setReady();
    };

    const handleKickPlayer = (targetGuid: string) => {
        server.dropFromLobby({ targetGuid });
    };

    const handleStart = () => {
        server.startGame();
    };

    const handleLogout = () => {
        server.logout();
    };

    const handleStartGame = () => {
        server.lobbyStart();
    };

    return (
        <div className="lobby" />
    );
};

export default Lobby;