import React, {useContext, useEffect, useState} from "react";
import { IBasePage, PAGES } from "../PageManager";
import { MediatorContext, ServerContext } from "../../App";
import './StartGame.css';

const StartGame: React.FC<IBasePage> = ({ setPage }) => {
    const server = useContext(ServerContext);
    const mediator = useContext(MediatorContext);
    const [isStarting, setIsStarting] = useState(false);

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
        await server.startGame();
    }

    return (
        <div className="start-game-container">
            <div className="start-game-content">
                <p>Нажмите кнопку ниже, чтобы начать игру</p>
                <form onSubmit={handleStartGame}>
                    <button id="testing-start-game" type="submit" >
                        Начать игру
                    </button>
                </form>
            </div>
        </div>
    )
}

export default StartGame;