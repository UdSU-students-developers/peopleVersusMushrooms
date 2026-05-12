import React, { useEffect, useMemo, useRef } from 'react';
import { GameState, MapTile, TCamera } from '../../../pages/Game/types';
import './Minimap.css';

interface MinimapProps {
  gameState: GameState | null;
  camera: TCamera;
}

const getTerrainColor = (tile: MapTile): string => {
  switch (tile) {
    case 0:
      return '#2ecc71';
    case 1:
      return '#7fd3ff';
    case 2:
      return '#8b5a2b';
    default:
      return '#1f2d24';
  }
};

const Minimap: React.FC<MinimapProps> = ({ gameState, camera }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const map = gameState?.map;

  const dots = useMemo(() => {
    if (!gameState) return [];

    const rows = gameState.map?.length || 100;
    const cols = gameState.map?.[0]?.length || 100;
    const ownBuildingTypes = ['vzryvomor', 'sporovaya_bashnya'];
    const clamp = (v: number) => Math.max(0, Math.min(100, v));

    const unitDots = gameState.units
      .filter((u) => u.hp > 0)
      .map((u) => ({
        guid: u.guid,
        color: '#42d96b',
        x: clamp(((u.x + 0.5) / cols) * 100),
        y: clamp(((u.y + 0.5) / rows) * 100),
      }));

    const buildingDots = gameState.buildings
      .filter((b) => b.hp > 0 && b.isAlive !== false)
      .map((b) => ({
        guid: b.guid,
        color: ownBuildingTypes.includes(b.type) ? '#ffd966' : '#f05252',
        x: clamp(((b.x + (b.sizeX ?? 1) / 2) / cols) * 100),
        y: clamp(((b.y + (b.sizeY ?? 1) / 2) / rows) * 100),
      }));

    return [...unitDots, ...buildingDots];
  }, [gameState]);

  const cameraRectStyle = useMemo(() => {
    if (!map?.[0]) return { display: 'none' };

    const rows = map.length;
    const cols = map[0].length;

    const currentTileSize = (window.innerWidth / cols) * camera.scale;
    const visibleCols = window.innerWidth / currentTileSize;
    const visibleRows = window.innerHeight / currentTileSize;

    const startTileX = -camera.offsetX / currentTileSize;
    const startTileY = -camera.offsetY / currentTileSize;

    const xPct = (startTileX / cols) * 100;
    const yPct = (startTileY / rows) * 100;
    const wPct = (visibleCols / cols) * 100;
    const hPct = (visibleRows / rows) * 100;

    return {
      left: `${xPct}%`,
      top: `${yPct}%`,
      width: `${wPct}%`,
      height: `${hPct}%`,
      position: 'absolute' as const,
      border: '1px solid white',
      boxSizing: 'border-box' as const,
      pointerEvents: 'none' as const,
      zIndex: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    };
  }, [map, camera.offsetX, camera.offsetY, camera.scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const rows = map.length;
    const cols = map[0]?.length ?? 0;

    if (rows > 0 && cols > 0) {
      const cellW = width / cols;
      const cellH = height / rows;
      ctx.clearRect(0, 0, width, height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.fillStyle = getTerrainColor(map[y][x]);
          ctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
        }
      }
    }
  }, [map]);

  return (
    <div className="game-minimap">
      <div className="minimap-field">
        <canvas ref={canvasRef} className="minimap-canvas" />

        {dots.map((dot) => (
          <div
            className="minimap-dot"
            key={dot.guid}
            style={{
              backgroundColor: dot.color,
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              position: 'absolute',
            }}
          />
        ))}

        <div className="minimap-camera-rect" style={cameraRectStyle} />
      </div>
    </div>
  );
};

export default React.memo(Minimap);
