import React, {useContext, useEffect, useState} from "react";
import { IBasePage, PAGES } from "../PageManager";
import { MediatorContext, ServerContext } from "../../App";
import CONFIG from "../../config";
import "./StartGame.css";

interface IUser {
    name: string;
    guid: string;
}

const StartGame: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const [isStarting, setIsStarting] = useState(false);
    const [userInfo, setUserInfo] = useState<IUser | null>(null);
    const { GET_STORE} = CONFIG.MEDIATOR.TRIGGERS;

    useEffect(() => {
        if (mediator) {
            const user = mediator.get<IUser | null>(GET_STORE, 'user');
            if (user) {
                setUserInfo(user);
            }
        }
    }, [mediator]);

    useEffect(() => {
        if (!mediator) return;

        const eventTypes = mediator.getEventTypes();

        const handleStartGame = () => {
            setIsStarting(false);
            setPage(PAGES.GAME);
        };

        mediator.subscribe(eventTypes.START_GAME, handleStartGame);

        return () => {
            mediator.unsubscribe(eventTypes.START_GAME, handleStartGame);
        };
    }, [mediator, setPage]);

    const handleStartGame = async (e: any) => {
        e.preventDefault();
        await server.createLobby();
    }

    const handleBackToLogin = () => {
        setPage(PAGES.LOGIN);
    }

    return (
        <div className="start-game-page">
            <div className="start-game-container">
                <h2>Лобби</h2>
                <div className="player-info-block">
                    {userInfo ? (
                        <>
                            <div className="info-row">
                                <span className="info-label">Игрок:</span>
                                <span className="info-value">{userInfo.name}</span>
                            </div>
                            <div>
                                <span className="info-label">Socket ID:</span>
                                <span className="info-value socket-id">{userInfo.guid}</span>
                            </div>
                        </>
                    ) : (
                        <div className="info-loading">Загрузка данных...</div>
                    )}
                </div>
                <div className="start-game-actions">
                    <button id="testing-start-game" type="submit" onClick={handleStartGame}>
                        Создать лобби и начать игру
                    </button>
                    <button className="back-button" id="testing-back-to-game" onClick={handleBackToLogin}>
                        Назад
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StartGame;