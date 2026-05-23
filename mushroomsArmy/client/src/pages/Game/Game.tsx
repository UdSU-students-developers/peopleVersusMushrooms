import React, { useEffect, useRef, useState, useContext } from 'react';
import { MediatorContext, ServerContext } from '../../App';
import CONFIG from '../../config';
import { drawGame, preloadFogWarTextures, setupCameraListeners } from './renderer/renderer';
import { GameState } from './types';
import { PAGES } from '../PageManager';
import { TUser } from '../../services/server/types';
import './Game.css';
import { camera } from '../../utils/camera';
import Header from '../../widgets/Header/Header';
import Footer from '../../widgets/Footer/Footer';
import Menu from '../../widgets/Menu/Menu';
import GameOver from '../../widgets/GameOver/GameOver';

const Game: React.FC<{ setPage: (page: PAGES) => void }> = ({ setPage }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const mediator = useContext(MediatorContext);
  const server = useContext(ServerContext);
  const [isGameOver, setIsGameOver] = useState(false);

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const GET_STORE = mediator.getTriggerTypes().GET_STORE;
  const user = mediator.get(GET_STORE, 'user') as TUser | null;
  const username = user?.name || 'Игрок';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    void preloadFogWarTextures();
  }, []);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !gameStateRef.current) return;

    if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return;

    drawGame(ctx, gameStateRef.current, camera);
  };

  useEffect(() => {
    const movementKeys = new Set([
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    ]);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (movementKeys.has(e.code)) e.preventDefault();
      keysPressed.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (movementKeys.has(e.code)) e.preventDefault();
      keysPressed.current[e.code] = false;
    };

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
      // Скорость перемещения не зависит от зума
      const moveSpeed = 20 / camera.scale;

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
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (displayWidth === 0 || displayHeight === 0) return;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    return setupCameraListeners(canvas);
  }, []);

  useEffect(() => {
    if (!mediator) return;

    const EVENT_NAME = CONFIG.MEDIATOR.EVENTS.GAME_STATE_UPDATED;
    const handler = (newState: GameState) => {
      gameStateRef.current = newState;
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
    const UNIT_TYPES: Record<string, 'sporomet' | 'champigneb' | 'eblekar' | 'pizdoglyad'> = {
      Digit1: 'sporomet',
      Digit2: 'champigneb',
      Digit3: 'eblekar',
      Digit4: 'pizdoglyad',
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
      />

      <Menu 
        isOpen={isMenuOpen} 
        onExit={handleExitToLobby} 
      />

      <div className="game-canvas-wrapper">
        <canvas ref={canvasRef} className="game-canvas" />
      </div>

      <Footer />

      {/* isGameOver && (
        <GameOver 
          onRestart={handleRestartGame} 
          onExit={handleExitToLobby} 
        />
      ) */}
    </div>
  );
};

export default Game;
