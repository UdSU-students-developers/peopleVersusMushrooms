const EasyStar = require('easystarjs');
const Building = require('./Building');

class Pipeline extends Building {
    constructor({ startX, startY, endX, endY, map, guid, economy, callbacks = {} }) {
        super({
            type: 'pipeline',
            guid,
            x: startX,
            y: startY,
            callbacks,
            hp: 100,
            size: 1,
        });
        
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        
        this.map = map;
        this.economy = economy;
        this.path = [];
        
        this._buildPath();
    }
    
    //строим путь
    _buildPath() {
        const easystar = new EasyStar.js();
        
        //получаем сетку проходимости из карты
        const grid = this.map;
        easystar.setGrid(grid);
        
        //разрешаем ходить только по определенным полям матрицы (0)
        easystar.setAcceptableTiles([0]);
        
        //ищем путь 
        easystar.findPath(this.startX, this.startY, this.endX, this.endY, (path) => {
            if (path) {
                this.path = path;
                //сообщаем экономике, что состояние изменилось
                this.economy.updated = true;
            }
        });
        
        easystar.calculate();
    }
    
    get() {
        return {
            ...super.get(),
            start: { x: this.startX, y: this.startY },
            end: { x: this.endX, y: this.endY },
            path: this.path
        };
    }
    
    //получить начальную точку
    getStartCoords() {
        return { x: this.startX, y: this.startY };
    }

    //получить конечную точку
    getEndCoords() {
        return { x: this.endX, y: this.endY };
    }
    
    //проверить, проходит ли трубопровод через указанную клетку
    containsCoord(x, y) {
        return this.path.some(point => point.x === x && point.y === y);
    }
    
    //получить все клетки, которые занял трубопровод
    getOccupiedCells() {
        return this.path;
    }
    
}

module.exports = Pipeline;