import React, { useContext, useEffect, useState } from 'react';
import { MediatorContext } from '../../../App';
import CONFIG from '../../../config';
import Minimap from '../MiniMap/Minimap';
import './Footer.css';
import { GameState, TCamera } from '../../../pages/Game/types';
import { camera as globalCamera } from '../../../utils/camera'

type FooterResource = {
  label: string;
  value: string | number;
};

const ECONOMY_RESOURCES = [
  { id: 'mycelium', label: 'Мицелий', value: 1250 },
  { id: 'fat', label: 'Жир', value: 420 },
  { id: 'iron', label: 'Железо', value: 85 },
  { id: 'energy', label: 'Энергия', value: '94%' },
];

const getFooterResources = (state: GameState | null): FooterResource[] => {
  const aliveUnits = state?.units.filter((unit) => unit.hp > 0) ?? [];
  const aliveBuildings =
    state?.buildings.filter((building) => building.hp > 0 && building.isAlive !== false) ?? [];

  return [
    {
      label: 'Спорометов',
      value: aliveUnits.filter((unit) => unit.type === 'sporomet').length,
    },
    {
      label: 'Шампиньебов',
      value: aliveUnits.filter((unit) => unit.type === 'champigneb').length,
    },
    {
      label: 'Еблекарей',
      value: aliveUnits.filter((unit) => unit.type === 'eblekar').length,
    },
    {
      label: 'Взрывоморов',
      value: aliveBuildings.filter((building) => building.type === 'vzryvomor').length,
    },
    {
      label: 'Споровых башен',
      value: aliveBuildings.filter((building) => building.type === 'sporovaya_bashnya').length,
    },
  ];
};

const Footer: React.FC = () => {
  const mediator = useContext(MediatorContext);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [resources, setResources] = useState<FooterResource[]>(getFooterResources(null));

  // Состояние для отрисовки (сюда будем копировать данные из globalCamera)
  const [cameraState, setCameraState] = useState<TCamera>({ ...globalCamera });

  useEffect(() => {
    // 1. Оставляем подписку на ресурсы и состояние игры[cite: 2]
    if (!mediator) return;
    const handler = (newState: GameState) => {
      setGameState(newState);
      setResources(getFooterResources(newState));
    };
    mediator.subscribe(CONFIG.MEDIATOR.EVENTS.GAME_STATE_UPDATED, handler);

    // 2. Добавляем цикл обновления для камеры
    // Будем проверять изменения каждые 16мс (~60 кадров в секунду)
    const interval = setInterval(() => {
      setCameraState({
        offsetX: globalCamera.offsetX,
        offsetY: globalCamera.offsetY,
        scale: globalCamera.scale,
        isDragging: globalCamera.isDragging,
        lastMouseX: globalCamera.lastMouseX,
        lastMouseY: globalCamera.lastMouseY,
      });
    }, 16);

    return () => {
      mediator.unsubscribe(CONFIG.MEDIATOR.EVENTS.GAME_STATE_UPDATED, handler);
      clearInterval(interval); // Важно очистить таймер
    };
  }, [mediator]);

  return (
    <footer className="game-footer-wrapper">
      {/* Контейнер для карты, зафиксированный слева */}
      <div className="minimap-container">
        <Minimap gameState={gameState} camera={cameraState} />
      </div>

      {/* Основная деревянная панель */}
      <div className="game-footer-main-panel">

        {/* Подложка ресурсов */}
        <div className="game-economy-resources">
          <span className="game-economy-resources-title">Ресурсы</span>
          <div className="game-economy-resources-list">
            {ECONOMY_RESOURCES.map((resource) => (
              <div className="game-economy-resource" key={resource.id}>
                <span className="game-economy-resource-label">{resource.label}:</span>
                <span className="game-economy-resource-value">{resource.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Подложка статистики юнитов */}
        <div className="game-footer-stats-container">
          <div className="game-footer-stats">
            {resources.map((resource) => (
              <div className="game-stat-item" key={resource.label}>
                <span className="game-stat-label">{resource.label}</span>
                <span className="game-stat-value">{resource.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
