import React, { useContext, useEffect, useState, useRef } from 'react';
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
import pizdoglyadImg from '../../assets/units/pizdoglyad/Pizdoglyad1.png';
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
  
  // Отслеживаем убитых юнитов по guid
  const [killedMushrooms, setKilledMushrooms] = useState<Record<string, number>>({});
  const [killedPeople, setKilledPeople] = useState<Record<string, number>>({});
  
  const prevUnitGuidsRef = useRef<{ mushroom: Set<string>; people: Set<string> }>({
    mushroom: new Set(),
    people: new Set(),
  });
  
  // Сохраняем информацию о всех когда-либо виденных юнитах для получения типа
  const allSeenUnitsRef = useRef<{ mushroom: Map<string, string>; people: Map<string, string> }>({
    mushroom: new Map(), // guid -> type
    people: new Map(),
  });
  
  // Сохраняем информацию об уже учтенных мертвецах
  const alreadyCountedDeadRef = useRef<{ mushroom: Set<string>; people: Set<string> }>({
    mushroom: new Set(),
    people: new Set(),
  });

  const [cameraState, setCameraState] = useState<TCamera>({ ...globalCamera });

  useEffect(() => {
    if (!mediator) return;

    const handler = (newState: GameState) => {
      setGameState(newState);
      const newMushroom = getMushroomArmy(newState);
      const newPeople = getPeopleArmy(newState);
      setMushroomArmy(newMushroom);
      setPeopleArmy(newPeople);

      // Собираем текущих живых грибов
      const currentMushGuids = new Set<string>();
      newState.units?.forEach((unit) => {
        if (unit.hp > 0) {
          currentMushGuids.add(unit.guid);
          // Запоминаем тип юнита
          allSeenUnitsRef.current.mushroom.set(unit.guid, unit.type);
        }
      });

      // Собираем текущих живых людей
      const currentPeopleGuids = new Set<string>();
      newState.enemyUnits?.forEach((unit) => {
        if ((unit.hp ?? 1) > 0) {
          currentPeopleGuids.add(unit.guid);
          // Запоминаем тип юнита
          allSeenUnitsRef.current.people.set(unit.guid, unit.type);
        }
      });

      // Находим убитых грибов
      const newDeadMushGuids: Array<{ guid: string; type: string }> = [];
      for (const guid of prevUnitGuidsRef.current.mushroom) {
        // Если юнит был живой, теперь мертв, и мы его еще не учли
        if (!currentMushGuids.has(guid) && !alreadyCountedDeadRef.current.mushroom.has(guid)) {
          const type = allSeenUnitsRef.current.mushroom.get(guid) || 'sporomet';
          newDeadMushGuids.push({ guid, type });
          alreadyCountedDeadRef.current.mushroom.add(guid);
        }
      }

      // Находим убитых людей
      const newDeadPeopleGuids: Array<{ guid: string; type: string }> = [];
      for (const guid of prevUnitGuidsRef.current.people) {
        // Если юнит был живой, теперь мертв, и мы его еще не учли
        if (!currentPeopleGuids.has(guid) && !alreadyCountedDeadRef.current.people.has(guid)) {
          const type = allSeenUnitsRef.current.people.get(guid) || 'soldier';
          newDeadPeopleGuids.push({ guid, type });
          alreadyCountedDeadRef.current.people.add(guid);
        }
      }

      // Обновляем счетчики убитых
      if (newDeadMushGuids.length > 0) {
        setKilledMushrooms((prev) => {
          const updated = { ...prev };
          newDeadMushGuids.forEach(({ type }) => {
            updated[type] = (updated[type] ?? 0) + 1;
          });
          return updated;
        });
      }

      if (newDeadPeopleGuids.length > 0) {
        setKilledPeople((prev) => {
          const updated = { ...prev };
          newDeadPeopleGuids.forEach(({ type }) => {
            updated[type] = (updated[type] ?? 0) + 1;
          });
          return updated;
        });
      }

      // Обновляем предыдущие guids для следующего обновления
      prevUnitGuidsRef.current = {
        mushroom: currentMushGuids,
        people: currentPeopleGuids,
      };
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

        {/* Убитые юниты - суммарно */}
        <div className="game-killed-units-box">
          <div className="killed-units-summary">
            <span className="killed-summary-label">☠ грибы:</span>
            <span className="killed-summary-count">
              {Object.values(killedMushrooms).reduce((sum, count) => sum + count, 0)}
            </span>
          </div>
          <div className="killed-units-summary">
            <span className="killed-summary-label">☠ люди:</span>
            <span className="killed-summary-count">
              {Object.values(killedPeople).reduce((sum, count) => sum + count, 0)}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;