// Game.test.tsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Game from './Game';
import { MediatorContext, ServerContext } from '../../App';

jest.mock('./GameCanvas', () => ({
    __esModule: true,
    default: () => <div data-testid="game-canvas">GameCanvas</div>,
}));

jest.mock('../Chat/ChatWidget', () => ({
    __esModule: true,
    default: () => <div data-testid="chat-widget">ChatWidget</div>,
}));

jest.mock('../../components/Button/Button', () => ({
    __esModule: true,
    default: ({ onClick, text, variant, className }: any) => (
        <button onClick={onClick} className={className} data-variant={variant}>
            {text}
        </button>
    ),
}));

jest.mock('../../config', () => ({
    CHAT_MAX_MESSAGE_LENGTH: 100,
    MEDIATOR: {
        TRIGGERS: {
            GET_STORE: 'GET_STORE',
            SET_STORE: 'SET_STORE',
        },
    },
    SOCKET: {
        START_GAME: 'START_GAME',
        UPDATE_SCENE: 'UPDATE_SCENE',
        RELIEF_LOADED: 'RELIEF_LOADED',
    },
}));

const createMockMediator = () => {
    const subscribe = jest.fn();
    const unsubscribe = jest.fn();
    const call = jest.fn();
    const getEventTypes = jest.fn(() => ({
        START_GAME: 'START_GAME',
        UPDATE_SCENE: 'UPDATE_SCENE',
    }));
    
    return { subscribe, unsubscribe, call, getEventTypes };
};

const createMockServer = () => ({
    leaveLobby: jest.fn(),
});

describe('Game', () => {
    let mockServer: ReturnType<typeof createMockServer>;
    let mockMediator: ReturnType<typeof createMockMediator>;
    const mockSetPage = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockServer = createMockServer();
        mockMediator = createMockMediator();
    });

    const renderGame = () => {
        const { MediatorContext, ServerContext } = require('../../App');
        
        return render(
            <ServerContext.Provider value={mockServer as any}>
                <MediatorContext.Provider value={mockMediator as any}>
                    <Game setPage={mockSetPage} />
                </MediatorContext.Provider>
            </ServerContext.Provider>
        );
    };

    test('рендерит игровой экран со всеми компонентами', () => {
        renderGame();
        
        expect(screen.getByText('Выйти')).toBeInTheDocument();
        expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
        expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
        expect(screen.getByText(/Железо:/)).toBeInTheDocument();
        expect(screen.getByText(/Энергия:/)).toBeInTheDocument();
    });

    test('отображает ресурсы из сцены', async () => {
        renderGame();
        
        const updateSceneHandler = mockMediator.subscribe.mock.calls.find(
            call => call[0] === 'UPDATE_SCENE'
        )?.[1];
        
        await act(async () => {
            if (updateSceneHandler) {
                updateSceneHandler({ resources: { iron: 150, energy: 80 } });
            }
        });
        
        expect(screen.getByText(/Железо: 150/)).toBeInTheDocument();
        expect(screen.getByText(/Энергия: 80/)).toBeInTheDocument();
    });

    test('подписывается на START_GAME и UPDATE_SCENE при монтировании', () => {
        renderGame();
        
        expect(mockMediator.subscribe).toHaveBeenCalledWith('START_GAME', expect.any(Function));
        expect(mockMediator.subscribe).toHaveBeenCalledWith('UPDATE_SCENE', expect.any(Function));
    });

    test('отписывается от событий при размонтировании', () => {
        const { unmount } = renderGame();
        unmount();
        
        expect(mockMediator.unsubscribe).toHaveBeenCalledWith('START_GAME', expect.any(Function));
        expect(mockMediator.unsubscribe).toHaveBeenCalledWith('UPDATE_SCENE', expect.any(Function));
    });

    test('открывает модальное окно при клике на кнопку "Выйти"', () => {
        renderGame();
        
        fireEvent.click(screen.getByText('Выйти'));
        
        expect(screen.getByText('Выйти из игры?')).toBeInTheDocument();
        expect(screen.getByText('Вы точно хотите покинуть игру?')).toBeInTheDocument();
        expect(screen.getByText('Да')).toBeInTheDocument();
        expect(screen.getByText('Нет')).toBeInTheDocument();
    });

    test('закрывает модальное окно при клике на "Нет"', () => {
        renderGame();
        
        fireEvent.click(screen.getByText('Выйти'));
        expect(screen.getByText('Выйти из игры?')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Нет'));
        
        expect(screen.queryByText('Выйти из игры?')).not.toBeInTheDocument();
        expect(screen.getByText('Выйти')).toBeInTheDocument();
    });

    test('вызывает server.leaveLobby и setPage при подтверждении выхода', () => {
        renderGame();
        
        fireEvent.click(screen.getByText('Выйти'));
        fireEvent.click(screen.getByText('Да'));
        
        expect(mockServer.leaveLobby).toHaveBeenCalled();
        expect(mockSetPage).toHaveBeenCalled();
    });

    test('не закрывает модальное окно при клике вне его', () => {
        renderGame();
        
        fireEvent.click(screen.getByText('Выйти'));
        expect(screen.getByText('Выйти из игры?')).toBeInTheDocument();
        
        fireEvent.click(screen.getByTestId('game-canvas'));
        
        expect(screen.getByText('Выйти из игры?')).toBeInTheDocument();
    });
});