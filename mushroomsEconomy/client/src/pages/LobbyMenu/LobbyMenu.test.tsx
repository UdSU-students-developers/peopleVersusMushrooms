// ChatWidget.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Мокаем все зависимости
jest.mock('../../Game/GameProcess', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../services/Canvas/Canvas', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../Game/Sprites', () => ({
    getTerrainSprite: jest.fn(),
    getMushroomSprite: jest.fn(),
    SPRITE: {},
}));
jest.mock('../../config', () => ({
    CHAT_MAX_MESSAGE_LENGTH: 100,
    MEDIATOR: { TRIGGERS: { GET_STORE: 'GET_STORE', SET_STORE: 'SET_STORE' } },
    SOCKET: { START_GAME: 'START_GAME', UPDATE_SCENE: 'UPDATE_SCENE', RELIEF_LOADED: 'RELIEF_LOADED' },
    GRAPHICS: { BORDER_PADDING: 0, MIN_ZOOM: 0.5, MAX_ZOOM: 2, ZOOM_FACTOR: 0.1, MAP_SIZE: 100, WINDOW: { WIDTH: 800, HEIGHT: 600, LEFT: 0, TOP: 0 } },
}));

// Глобальные переменные для моков
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
const mockGetEventTypes = jest.fn(() => ({
    NEW_MESSAGE: 'NEW_MESSAGE',
    MESSAGES_LOADED: 'MESSAGES_LOADED',
}));
const mockGet = jest.fn();
const mockSendMessage = jest.fn();
const mockGetMessages = jest.fn();

// Мокаем App с возвратом контекстов, которые используют замыкание на моки
jest.mock('../../App', () => ({
    MediatorContext: React.createContext({
        get: (trigger: string, name: string) => {
            if (trigger === 'GET_STORE' && name === 'user') return { name: 'TestUser' };
            if (trigger === 'GET_STORE' && name === 'messages') return [];
            return null;
        },
        subscribe: (...args: any[]) => mockSubscribe(...args),
        unsubscribe: (...args: any[]) => mockUnsubscribe(...args),
        getEventTypes: () => mockGetEventTypes(),
    }),
    ServerContext: React.createContext({
        sendMessage: (msg: string) => mockSendMessage(msg),
        getMessages: () => mockGetMessages(),
    }),
    GameContext: React.createContext(null),
}));

import ChatWidget from './ChatWidget';

describe('ChatWidget', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('не рендерит ничего если пользователь не авторизован', async () => {
        const { rerender } = render(<ChatWidget />);
        
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('показывает кнопку открытия чата когда пользователь авторизован', () => {
        render(<ChatWidget />);
        
        expect(screen.getByText('💬')).toBeInTheDocument();
    });

    test('открывает окно чата при клике на кнопку', () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByText('💬'));
        
        expect(screen.getByText('Чат')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Сообщение...')).toBeInTheDocument();
    });

    test('закрывает окно чата при клике на крестик', () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByText('💬'));
        expect(screen.getByText('Чат')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('✕'));
        expect(screen.queryByText('Чат')).not.toBeInTheDocument();
        expect(screen.getByText('💬')).toBeInTheDocument();
    });

    test('отправляет сообщение при клике на кнопку', async () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByText('💬'));
        
        const input = screen.getByPlaceholderText('Сообщение...');
        await userEvent.type(input, 'Тестовое сообщение');
        
        fireEvent.click(screen.getByText('→'));
        
        expect(mockSendMessage).toHaveBeenCalledWith('Тестовое сообщение');
        expect(input).toHaveValue('');
    });

    test('отправляет сообщение при нажатии Enter', async () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByText('💬'));
        
        const input = screen.getByPlaceholderText('Сообщение...');
        await userEvent.type(input, 'Сообщение с Enter{enter}');
        
        expect(mockSendMessage).toHaveBeenCalledWith('Сообщение с Enter');
    });

    test('не отправляет пустое сообщение', async () => {
        render(<ChatWidget />);
        fireEvent.click(screen.getByText('💬'));
        
        const input = screen.getByPlaceholderText('Сообщение...');
        await userEvent.type(input, '   {enter}');
        
        expect(mockSendMessage).not.toHaveBeenCalled();
    });

    test('показывает ошибку при превышении лимита символов', async () => {
        const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
        render(<ChatWidget />);
        fireEvent.click(screen.getByText('💬'));
        
        const input = screen.getByPlaceholderText('Сообщение...');
        const longMessage = 'a'.repeat(101);
        await userEvent.type(input, longMessage);
        
        fireEvent.click(screen.getByText('→'));
        
        expect(mockAlert).toHaveBeenCalledWith('Сообщение не должно превышать 100 символов');
        expect(mockSendMessage).not.toHaveBeenCalled();
        
        mockAlert.mockRestore();
    });
});