// ChatWidget.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatWidget from './ChatWidget';

jest.mock('../../Game/GameProcess', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../services/Canvas/Canvas', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../Game/Sprites', () => ({
    getTerrainSprite: jest.fn(),
    getMushroomSprite: jest.fn(),
    SPRITE: {},
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
    GRAPHICS: {
        BORDER_PADDING: 0,
        MIN_ZOOM: 0.5,
        MAX_ZOOM: 2,
        ZOOM_FACTOR: 0.1,
        MAP_SIZE: 100,
        WINDOW: { WIDTH: 800, HEIGHT: 600, LEFT: 0, TOP: 0 },
    },
}));

const createMockMediator = (user = null, messages = []) => {
    const getEventTypes = jest.fn(() => ({
        NEW_MESSAGE: 'NEW_MESSAGE',
        MESSAGES_LOADED: 'MESSAGES_LOADED',
    }));
    
    const get = jest.fn((trigger, name) => {
        if (trigger === 'GET_STORE' && name === 'user') return user;
        if (trigger === 'GET_STORE' && name === 'messages') return messages;
        return null;
    });
    
    const subscribe = jest.fn();
    const unsubscribe = jest.fn();
    
    return { get, subscribe, unsubscribe, getEventTypes };
};

const createMockServer = () => ({
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
});

describe('ChatWidget', () => {
    let mockServer: ReturnType<typeof createMockServer>;
    let mockMediator: ReturnType<typeof createMockMediator>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockServer = createMockServer();
        mockMediator = createMockMediator({ name: 'TestUser' }, []);
    });

    const renderChatWidget = (user = { name: 'TestUser' }, messages = []) => {
        mockMediator = createMockMediator(user, messages);
        
        const { MediatorContext, ServerContext, GameContext } = require('../../App');
        
        return render(
            <ServerContext.Provider value={mockServer as any}>
                <MediatorContext.Provider value={mockMediator as any}>
                    <GameContext.Provider value={null}>
                        <ChatWidget />
                    </GameContext.Provider>
                </MediatorContext.Provider>
            </ServerContext.Provider>
        );
    };

    test('не рендерит ничего если пользователь не авторизован', () => {
        renderChatWidget(null);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('показывает кнопку открытия чата когда пользователь авторизован', () => {
        renderChatWidget({ name: 'TestUser' });
        expect(screen.getByText('💬')).toBeInTheDocument();
    });

    test('открывает окно чата при клике на кнопку', () => {
        renderChatWidget({ name: 'TestUser' });
        fireEvent.click(screen.getByText('💬'));
        expect(screen.getByText('Чат')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Сообщение...')).toBeInTheDocument();
    });

    test('закрывает окно чата при клике на крестик', () => {
        renderChatWidget({ name: 'TestUser' });
        fireEvent.click(screen.getByText('💬'));
        expect(screen.getByText('Чат')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('✕'));
        expect(screen.queryByText('Чат')).not.toBeInTheDocument();
        expect(screen.getByText('💬')).toBeInTheDocument();
    });

    test('отображает сообщение "Нет сообщений" когда список пуст', () => {
        renderChatWidget({ name: 'TestUser' }, []);
        fireEvent.click(screen.getByText('💬'));
        expect(screen.getByText('Нет сообщений')).toBeInTheDocument();
    });

    test('отображает список сообщений', () => {
        const messages = [
            { author: 'User1', message: 'Привет!', created: new Date().toISOString() },
            { author: 'User2', message: 'Здравствуй!', created: new Date().toISOString() },
        ];
        renderChatWidget({ name: 'User1' }, messages);
        fireEvent.click(screen.getByText('💬'));
        
        expect(screen.getByText('Привет!')).toBeInTheDocument();
        expect(screen.getByText('Здравствуй!')).toBeInTheDocument();
    });

    test('отправляет сообщение при клике на кнопку', async () => {
        renderChatWidget({ name: 'TestUser' });
        fireEvent.click(screen.getByText('💬'));
        
        const input = screen.getByPlaceholderText('Сообщение...');
        await userEvent.type(input, 'Тестовое сообщение');
        
        fireEvent.click(screen.getByText('→'));
        
        expect(mockServer.sendMessage).toHaveBeenCalledWith('Тестовое сообщение');
        expect(input).toHaveValue('');
    });

    test('отправляет сообщение при нажатии Enter', async () => {
        renderChatWidget({ name: 'TestUser' });
        fireEvent.click(screen.getByText('💬'));
        
        const input = screen.getByPlaceholderText('Сообщение...');
        await userEvent.type(input, 'Сообщение с Enter{enter}');
        
        expect(mockServer.sendMessage).toHaveBeenCalledWith('Сообщение с Enter');
    });

    test('не отправляет пустое сообщение', async () => {
        renderChatWidget({ name: 'TestUser' });
        fireEvent.click(screen.getByText('💬'));
        
        const input = screen.getByPlaceholderText('Сообщение...');
        await userEvent.type(input, '   {enter}');
        
        expect(mockServer.sendMessage).not.toHaveBeenCalled();
    });

    test('показывает ошибку при превышении лимита символов', async () => {
        const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
        renderChatWidget({ name: 'TestUser' });
        fireEvent.click(screen.getByText('💬'));
        
        const input = screen.getByPlaceholderText('Сообщение...');
        const longMessage = 'a'.repeat(101);
        await userEvent.type(input, longMessage);
        
        fireEvent.click(screen.getByText('→'));
        
        expect(mockAlert).toHaveBeenCalledWith('Сообщение не должно превышать 100 символов');
        expect(mockServer.sendMessage).not.toHaveBeenCalled();
        
        mockAlert.mockRestore();
    });
});