import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { IBasePage } from '../PageManager';
import CONFIG from '../../config';
import Common from '../../services/Common/Common';

const CELL = 12; // размер клетки в пикселях, карта 50x50 → canvas 600x600
const common = new Common();

interface UnitData {
    guid: string;
    x: number;
    y: number;
    targetX: number | null;
    targetY: number | null;
    hp: number;
}

const Army: React.FC<IBasePage> = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const unitsRef = useRef<UnitData[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // canvas render loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf: number;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // сетка
            ctx.strokeStyle = '#eee';
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= 50; i++) {
                ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 600); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(600, i * CELL); ctx.stroke();
            }

            // юниты
            unitsRef.current.forEach((u) => {
                const px = u.x * CELL + CELL / 2;
                const py = u.y * CELL + CELL / 2;

                // линия к цели
                if (u.targetX !== null && u.targetY !== null) {
                    ctx.strokeStyle = '#a0c4ff';
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(u.targetX * CELL + CELL / 2, u.targetY * CELL + CELL / 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // кружок
                ctx.fillStyle = '#185fa5';
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fill();
            });

            raf = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(raf);
    }, []);

    // сокет
    useEffect(() => {
        const client = io(CONFIG.SERVER_URL);
        setSocket(client);

        client.on('connect', () => setIsConnected(true));
        client.on('disconnect', () => setIsConnected(false));

        client.on(CONFIG.SOCKET.ARMY_STATE, (units: UnitData[]) => {
            unitsRef.current = units;
        });
        

        return () => { client.disconnect(); };
    }, []);

    const createUnit = () => {
        if (!socket) return;
        const guid = common.guid();
        socket.emit(CONFIG.SOCKET.CREATE_UNIT, { guid, x: 5, y: 5 });
    };

    const setTarget = () => {
        if (!socket || unitsRef.current.length === 0) return;
        const guid = unitsRef.current[0].guid;
        socket.emit(CONFIG.SOCKET.SET_UNIT_TARGET, { guid, targetX: 40, targetY: 40 });
    };

    return (
        <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: isConnected ? 'green' : 'red' }}>
                    {isConnected ? 'Подключено' : 'Отключено'}
                </span>
                <button onClick={createUnit} disabled={!isConnected}>Создать юнита</button>
                <button onClick={setTarget} disabled={!isConnected}>Задать цель</button>
            </div>
            <canvas ref={canvasRef} width={600} height={600} style={{ border: '1px solid #ddd' }} />
        </div>
    );
};

export default Army;