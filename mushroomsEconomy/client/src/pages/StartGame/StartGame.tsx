import React, {useContext, useEffect, useState} from "react";
import { IBasePage, PAGES } from "../PageManager";
import { MediatorContext, ServerContext } from "../../App";
import CONFIG from "../../config";

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
        <div>
            <div>
                <h2>Лобби</h2>
                <div>
                    {userInfo ? (
                        <>
                            <div>
                                <span>Игрок:</span>
                                <span>{userInfo.name}</span>
                            </div>
                            <div>
                                <span>Socket ID:</span>
                                <span>{userInfo.guid}</span>
                            </div>
                        </>
                    ) : (
                        <div>Загрузка данных...</div>
                    )}
                </div>
                <div>
                    <button id="testing-start-game" type="submit" onClick={handleStartGame}>
                        Создать лобби и начать игру
                    </button>
                    <button id="testing-back-to-game" onClick={handleBackToLogin}>
                        Назад
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StartGame;