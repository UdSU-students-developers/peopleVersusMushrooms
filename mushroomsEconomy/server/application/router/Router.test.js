const mockMediator = { test: 'mediator' };
const mockAnswer = { test: 'answer' };

describe('Маршрутизатор игры', () => {
    let mockRouter;
    let Router;

    beforeEach(() => {
        jest.resetModules();

        // Подготовка мок-роутера Express
        mockRouter = {
            post: jest.fn(),
            all: jest.fn()
        };

        jest.mock('express', () => ({
            Router: jest.fn(() => mockRouter)
        }));

        jest.mock('../../../../global/globalConfig', () => ({
            URLS: {
                LOBBY_UPDATED: '/api/lobby-updated',
                START_GAME: '/api/start-game',
                APPLY_DAMAGE: '/api/damage',
                MOVE: '/api/move'
            }
        }));

        jest.mock('./handlers', () => ({
            notFoundHandler: 'notFoundHandlerMock',
            useLobbyUpdatedHandler: jest.fn(() => 'lobbyHandler'),
            useStartGameHandler: jest.fn(() => 'startHandler'),
            useDamageHandler: jest.fn(() => 'damageHandler')
        }));

        jest.mock('./handlers/game/useMoveHandler', () =>
            jest.fn(() => 'moveHandler')
        );

        // Импорт модуля после настройки моков
        Router = require('./router');
    });

    it('должен экспортировать функцию', () => {
        expect(typeof Router).toBe('function');
    });

    describe('При создании роутера', () => {
        let созданныйРоутер;

        beforeEach(() => {
            созданныйРоутер = Router({ mediator: mockMediator, answer: mockAnswer });
        });

        it('должен создавать новый экземпляр роутера Express', () => {
            const express = require('express');
            expect(express.Router).toHaveBeenCalledTimes(1);
        });

        it('должен настроить POST-маршрут для обновления лобби', () => {
            const { useLobbyUpdatedHandler } = require('./handlers');
            expect(useLobbyUpdatedHandler).toHaveBeenCalledWith(mockMediator, mockAnswer);
            expect(mockRouter.post).toHaveBeenCalledWith('/api/lobby-updated', 'lobbyHandler');
        });

        it('должен настроить POST-маршрут для начала игры', () => {
            const { useStartGameHandler } = require('./handlers');
            expect(useStartGameHandler).toHaveBeenCalledWith(mockMediator, mockAnswer);
            expect(mockRouter.post).toHaveBeenCalledWith('/api/start-game', 'startHandler');
        });

        it('должен настроить POST-маршрут для получения урона', () => {
            const { useDamageHandler } = require('./handlers');
            expect(useDamageHandler).toHaveBeenCalledWith(mockMediator, mockAnswer);
            expect(mockRouter.post).toHaveBeenCalledWith('/api/damage', 'damageHandler');
        });

        it('должен настроить POST-маршрут для движения', () => {
            const useMoveHandler = require('./handlers/game/useMoveHandler');
            expect(useMoveHandler).toHaveBeenCalledWith(mockMediator, mockAnswer);
            expect(mockRouter.post).toHaveBeenCalledWith('/api/move', 'moveHandler');
        });

        it('должен назначить обработчик для всех несуществующих путей', () => {
            expect(mockRouter.all).toHaveBeenCalledWith('/*path', 'notFoundHandlerMock');
        });

        it('должен возвращать созданный роутер', () => {
            expect(созданныйРоутер).toBe(mockRouter);
        });
    });
});