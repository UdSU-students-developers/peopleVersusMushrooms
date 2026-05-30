import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediatorContext } from '../../App';

jest.mock('../PageManager', () => ({
    PAGES: {
        GAME: 'GAME',
        CHAT: 'CHAT',
    },
}));

jest.mock('../Registration/Registration', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../Login/Login', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../Game/Game', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../LobbyMenu/LobbyMenu', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('../../Game/GameProcess', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../services/Server/Server', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../services/Mediator/Mediator', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../services/Store/useStore', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../services/Mediator/useMediator', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        get: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        call: jest.fn(),
        getEventTypes: jest.fn(() => ({})),
        set: jest.fn(),
    })),
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

import GameMenu from './GameMenu';

interface MockUser {
    name: string;
}

interface MockMediator {
    get: jest.Mock;
}

const createMockMediator = (user: MockUser | null = null): MockMediator => {
    const get = jest.fn((trigger: string, name: string) => {
        if (trigger === 'GET_STORE' && name === 'user') return user;
        return null;
    });
    
    return { get };
};

describe('GameMenu', () => {
    const mockSetPage = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderGameMenu = (user: MockUser | null = { name: 'TestPlayer' }) => {
        const mockMediator = createMockMediator(user);
        
        return render(
            <MediatorContext.Provider value={mockMediator as any}>
                <GameMenu setPage={mockSetPage} />
            </MediatorContext.Provider>
        );
    };

    test('отображает информацию о пользователе если пользователь авторизован', () => {
        renderGameMenu({ name: 'TestPlayer' });
        
        expect(screen.getByText('Игрок:')).toBeInTheDocument();
        expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    });

    test('не отображает информацию о пользователе если пользователь не авторизован', () => {
        renderGameMenu(null);
        
        expect(screen.queryByText('Игрок:')).not.toBeInTheDocument();
    });

    test('отображает заголовок меню', () => {
        renderGameMenu();
        
        expect(screen.getByText('Меню игры')).toBeInTheDocument();
    });

    test('отображает кнопку "Вернуться в игру"', () => {
        renderGameMenu();
        
        expect(screen.getByText('Вернуться в игру')).toBeInTheDocument();
    });

    test('отображает кнопку "Чат"', () => {
        renderGameMenu();
        
        expect(screen.getByText('Чат')).toBeInTheDocument();
    });

    test('вызывает setPage при клике на "Вернуться в игру"', () => {
        renderGameMenu();
        
        fireEvent.click(screen.getByText('Вернуться в игру'));
        
        expect(mockSetPage).toHaveBeenCalled();
    });

    test('вызывает setPage при клике на "Чат"', () => {
        renderGameMenu();
        
        fireEvent.click(screen.getByText('Чат'));
        
        expect(mockSetPage).toHaveBeenCalled();
    });

    test('отображает оба действия в контейнере меню', () => {
        renderGameMenu();
        
        const menuActions = document.querySelector('.menu-actions');
        expect(menuActions).toBeInTheDocument();
        expect(menuActions?.children).toHaveLength(2);
    });
});