const EasyStar = require('easystarjs');
const CONFIG = require('../../config');

const Mycelium = require('./entities/Mycelium');

const { INTERVAL } = CONFIG.ECONOMY;

class Economy {
    constructor({ db, common, callbacks: { }, map = null, guid }) {
        this.easyStar = new EasyStar.js();

        this.guid = guid; // совпадает с guid игрока
        this.db = db;
        this.common = common;
        this.callbacks = this.callbacks;

        this.n = 50;
        this.m = 50;
        this.mapInit(map);

        this.resourceMap; // массив известных ресурсов [{x, y, value}]
        this.buildings = []; // здания
        this.mycelium = []; // грибница
        this.addMycelium(50, 49);
        this.workers = []; // рабочие
        this.larvae = []; // массив личинок

        // данные про врагов

        // start game proccess
        this.interval = setInterval(() => this.update(), INTERVAL);
    }

    mapInit(map) { //Временный метод для заглушки
        if (map) {
            this.map = map;
        } else {
            console.log('Карта не передана при создании экономики! Используется заглушка!');
            this.map = Array(this.n).fill().map(() => Array(this.m).fill(0));
            this.map[12][12] = 1;
            this.map[13][13] = 1;
            this.map[14][14] = 1;
            this.map[14][12] = 1;
            this.map[12][14] = 1;
            this.map[12][13] = 1;
            this.map[12][14] = 1;
            this.map[11][12] = 1;
            this.map[12][7] = 1;
        }
    }

    addMycelium(x, y) {
        const mycelium = new Mycelium({
            x,
            y,
            guid: this.guid,
            callbacks: {
                checkAround: (x, y) => this.checkAroundMycelium(x, y),
                extend: (x, y) => this.addMycelium(x, y),
            },
        });
        this.map[y][x] = 1;
        this.mycelium.push(mycelium);
    }

    checkAroundMycelium(x, y) {
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 },
            { dx: 1, dy: 1 },
        ];

        return directions
            .map(({ dx, dy }) => ({ x: x + dx, y: y + dy }))
            .filter(({ x: nx, y: ny }) =>
                nx >= 0 && nx < this.m &&
                ny >= 0 && ny < this.n &&
                this.map[ny][nx] === 0
            );
    }

    destructor() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    get() {
    }

    printMap() {
        console.log(`\n===========================`);
        this.map.forEach(row => {
            console.log(row.join(' '));
        });
        console.log('===========================\n');
    }

    update() {
        this.mycelium.forEach(mycelium => mycelium.update());
        console.clear();
        this.printMap();
        //...
    }
}

module.exports = Economy;