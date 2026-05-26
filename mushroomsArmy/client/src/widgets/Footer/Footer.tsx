import React, { useContext, useEffect, useState } from 'react';
import { MediatorContext } from '../../App';
import CONFIG from '../../config';
import Minimap from '../MiniMap/Minimap';
import './Footer.css';
import { GameState, TCamera } from '../../pages/Game/types';
import { camera as globalCamera } from '../../utils/camera';
import { buildCircularVisibilityMask } from '../../pages/Game/renderer/fogOfWar';

import sporometImg from '../../assets/units/Sporomet.png';
import champignebImg from '../../assets/units/Champigneb.png';
import eblekarImg from '../../assets/units/Eblekar.png';
import pizdoglyadImg from '../../assets/units/Pizdoglyad1.png';
import vzryvomorImg from '../../assets/buildings/vzryvomor/frame_0.png'
import sporovayaBashnyaImg from '../../assets/buildings/sporovaya_bashnya/idle.png'

import soldierImg from '../../assets/people/soldier.png';
import sniperImg from '../../assets/people/sniper.png';
import bmpImg from '../../assets/people/bmp.png';
import partizanImg from '../../assets/people/partizan1.png';

const ECONOMY_RESOURCES = [
  { id: 'mycelium', label: 'Мицелий', value: 1250 },
  { id: 'fat', label: 'Жир', value: 420 },
  { id: 'iron', label: 'Железо', value: 85 },
  { id: 'energy', label: 'Энергия', value: '94%' },
];

const MUSHROOM_UNITS = [
  { type: 'sporomet',     label: 'Споромет',     image: sporometImg },
  { type: 'champigneb',   label: 'Шампиньеб',   image: champignebImg },
  { type: 'eblekar',      label: 'Еблекарь',    image: eblekarImg },
  { type: 'pizdoglyad',   label: 'Пиздогляд',   image: pizdoglyadImg },
  { type: 'vzryvomor',      label: 'Взрывомор',    image: vzryvomorImg },
  { type: 'sporovaya_bashnya', label: 'Споровая башня', image: sporovayaBashnyaImg },
] as const;

const PEOPLE_ARMY_UNITS = [
  { type: 'soldier', label: 'Солдат', image: soldierImg },
  { type: 'sniper', label: 'Снайпер', image: sniperImg },
  { type: 'bmp', label: 'БМП', image: bmpImg },
  { type: 'partizan', label: 'Партизан', image: partizanImg },
] as const;


const getMushroomArmy = (state: GameState | null) => {
  const aliveUnits = state?.units?.filter((unit) => unit.hp > 0) ?? [];
  const aliveBuildings = state?.buildings?.filter((b) => b.hp > 0 && b.isAlive !== false) ?? [];

  return MUSHROOM_UNITS.map((unit) => {
    let count = 0;
    if (unit.type === 'vzryvomor' || unit.type === 'sporovaya_bashnya') {
      count = aliveBuildings.filter((b) => b.type === unit.type).length;
    } else {
      count = aliveUnits.filter((u) => u.type === unit.type).length;
    }
    return { ...unit, count };
  });
};

const getPeopleArmy = (state: GameState | null) => {
  if (!state?.map?.length) {
    return PEOPLE_ARMY_UNITS.map((unit) => ({ ...unit, count: 0 }));
  }

  const rows = state.map.length;
  const cols = state.map[0]?.length ?? 0;
  const visibilityMask = buildCircularVisibilityMask(state, rows, cols);

  const visibleUnits = state?.enemyUnits?.filter((unit) => {
    if ((unit.hp ?? 1) <= 0) return false;
    const ux = Math.floor(unit.x);
    const uy = Math.floor(unit.y);
    return visibilityMask[uy]?.[ux] === true;
  }) ?? [];

  return PEOPLE_ARMY_UNITS.map((unit) => ({
    ...unit,
    count: visibleUnits.filter((u) => u.type === unit.type).length,
  }));
};

const Footer: React.FC = () => {
  const mediator = useContext(MediatorContext);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mushroomArmy, setMushroomArmy] = useState(getMushroomArmy(null));
  const [peopleArmy, setPeopleArmy] = useState(getPeopleArmy(null));

  const [cameraState, setCameraState] = useState<TCamera>({ ...globalCamera });

  useEffect(() => {
    if (!mediator) return;

    const handler = (newState: GameState) => {
      setGameState(newState);
      setMushroomArmy(getMushroomArmy(newState));
      setPeopleArmy(getPeopleArmy(newState));
    };

    mediator.subscribe(CONFIG.MEDIATOR.EVENTS.GAME_STATE_UPDATED, handler);

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
      clearInterval(interval);
    };
  }, [mediator]);

  return (
    <footer className="game-footer-wrapper">
      <div className="minimap-container">
        <Minimap gameState={gameState} camera={cameraState} />
      </div>

      <div className="game-footer-main-panel">
        {/* Ресурсы */}
        {/* <div className="game-economy-box">
          <span className="game-section-title">•РЕСУРСы•</span>
          <div className="game-economy-list">
            {ECONOMY_RESOURCES.map((res) => (
              <div className="game-info-item" key={res.id}>
                <span className="game-info-label">{res.label}:</span>
                <span className="game-info-value">{res.value}</span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Армия */}
        <div className="game-army-box">
          <span className="game-section-title">•армия грибов•</span>
          <div className="game-army-list">
            {mushroomArmy.map((unit) => (
              <div className="army-unit-item" key={unit.type} title={unit.label}>
                <img
                  src={unit.image}
                  alt={unit.label}
                  className="unit-icon"
                  width={50}
                  height={50}
                />
                <span className="unit-count">{unit.count}</span>
              </div>
            ))}
          </div>
        </div>



        {/* Армия - ВРАГИ */}
        <div className="game-army-enemy-box">
          <span className="game-section-title">•армия людей•</span>
          <div className="game-army-list">
            {peopleArmy.map((unit) => (
              <div className="army-unit-item" key={unit.type} title={unit.label}>
                <img
                  src={unit.image}
                  alt={unit.label}
                  className="unit-icon"
                  width={50}
                  height={50}
                />
                <span className="unit-count">{unit.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;