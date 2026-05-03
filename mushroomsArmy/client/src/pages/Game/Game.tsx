// pages/Game/Game.tsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { MediatorContext, ServerContext } from '../../App';
import CONFIG from '../../config';
import { drawGame } from './renderer';
import { GameState } from './types';
import { PAGES } from '../PageManager';
import { TUser } from '../../services/server/types';
import './Game.css';
import { camera } from '../../utils/camera';
import Header from '../../widgets/GameInterface/Header/Header';
import Footer from '../../widgets/GameInterface/Footer/Footer';
import Menu from '../../widgets/GameInterface/Menu/Menu';

const Game: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const mediator = useContext(MediatorContext);
  const server = useContext(ServerContext);
  const [isGameOver, setIsGameOver] = useState(false);
  const [aliveUnitsCount, setAliveUnitsCount] = useState(0);

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const GET_STORE = mediator.getTriggerTypes().GET_STORE;
  const user = mediator.get(GET_STORE, 'user') as TUser | null;
  const username = user?.name || 'Игрок';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !gameStateRef.current) return;

    const widthCSS = canvas.clientWidth;
    const heightCSS = canvas.clientHeight;
    if (widthCSS === 0 || heightCSS === 0) return;

    // Рисуем текущее состояние с учетом обновленной камеры
    drawGame(ctx, gameStateRef.current, widthCSS, heightCSS, camera);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    let rafId: number;

    const renderLoop = () => {
  // Скорость движения, которая не зависит от зума
      const moveSpeed = 10 / camera.scale; 

      if (keysPressed.current['KeyW'] || keysPressed.current['ArrowUp']) {
        camera.offsetY += moveSpeed;
      }
      if (keysPressed.current['KeyS'] || keysPressed.current['ArrowDown']) {
        camera.offsetY -= moveSpeed;
      }
      if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) {
        camera.offsetX += moveSpeed;
      }
      if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) {
        camera.offsetX -= moveSpeed;
      }

      redrawCanvas();
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(rafId); // Остановка при выходе из игры
    };
  }, []); // Запускается один раз при старте

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (displayWidth === 0 || displayHeight === 0) return;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        redrawCanvas();
      }
    };

    resizeCanvas();

    let rafId: number | null = null;
    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        resizeCanvas();
        rafId = null;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
  if (!mediator) return;

  const EVENT_NAME = CONFIG.MEDIATOR.EVENTS.GAME_STATE_UPDATED;
  const handler = (newState: GameState) => {
    gameStateRef.current = newState;
    
    // Считаем юнитов только здесь (когда пришли данные), а не в цикле отрисовки
    const aliveCount = newState.units.filter((unit) => unit.hp > 0).length ?? 0;
    setAliveUnitsCount(aliveCount);

    // gameStateRef.current = newState;
    // redrawCanvas();
  };

  mediator.subscribe(EVENT_NAME, handler);
  return () => mediator.unsubscribe(EVENT_NAME, handler);
  }, [mediator]);

  useEffect(() => {
    if (!mediator) return;
    const GAME_OVER_EVENT = CONFIG.MEDIATOR.EVENTS.GAME_OVER;
    const handler = () => setIsGameOver(true);
    mediator.subscribe(GAME_OVER_EVENT, handler);
    return () => mediator.unsubscribe(GAME_OVER_EVENT, handler);
  }, [mediator]);

  useEffect(() => {
    const UNIT_TYPES: Record<string, 'sporomet' | 'champigneb' | 'eblekar'> = {
      Digit1: 'sporomet',
      Digit2: 'champigneb',
      Digit3: 'eblekar',
    };

    const handleSpawnKey = (e: KeyboardEvent) => {
      const type = UNIT_TYPES[e.code];
      if (!type) return;

      const map = gameStateRef.current?.map;
      if (!map || map.length === 0) return;

      const rows = map.length;
      const cols = map[0].length;
      let spawnX = -1;
      let spawnY = -1;

      outer: for (let dy = 0; dy < rows; dy++) {
        for (let dx = 0; dx < cols; dx++) {
          const y = rows - 1 - dy;
          const x = cols - 1 - dx;
          if (map[y][x] === 0) {
            spawnX = x;
            spawnY = y;
            break outer;
          }
        }
      }

      if (spawnX === -1) return;
      server.spawnUnit(type, spawnX, spawnY);
    };

    window.addEventListener('keydown', handleSpawnKey);
    return () => window.removeEventListener('keydown', handleSpawnKey);
  }, [server]);

  const handleExitToLobby = () => {
    setIsGameOver(false);
    setPage(PAGES.LOBBY);
  };

  const handleRestartGame = () => {
    server.lobbyStart();
    setIsGameOver(false);
  };

  return (
    <div className="game-page">
      <Header
        username={username}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        //onExit={handleExitToLobby}
      />

      {/* Меню теперь живет здесь, на уровне страницы, что архитектурно правильнее */}
      <Menu 
        isOpen={isMenuOpen} 
        onExit={handleExitToLobby} 
      />

      <div className="game-canvas-wrapper">
        <canvas ref={canvasRef} className="game-canvas" />
      </div>

      <Footer />

      {isGameOver && (
        <div className="game-overlay">
          <div className="game-overlay-content">
            <h2>Игра окончена</h2>
            <div className="game-overlay-actions">
              <button type="button" onClick={handleRestartGame}>
                Начать заново
              </button>
              <button type="button" onClick={handleExitToLobby}>
                В лобби
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;