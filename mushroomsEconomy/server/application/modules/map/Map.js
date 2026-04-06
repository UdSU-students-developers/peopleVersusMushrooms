class Map {  //TEMPORARY MODULE! УДАЛТЬ ПОСЛЕ ПОЯВЛЕНИЯ СООТВЕТСТВУЮЩЕГО СЕРВИСА
    constructor() {
        this.map = null;
    }

    generate(width = 50, height = 50) {
        this.map = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push(0);
            }
            this.map.push(row);
        }

        const spotsCount = Math.floor(Math.random() * 10) + 5;
        const maxRadius = 10;

        for (let i = 0; i < spotsCount; i++) {
            const cx = Math.floor(Math.random() * width);
            const cy = Math.floor(Math.random() * height);

            const type = Math.random() > 0.5 ? 1 : 2;

            const currentRadius = Math.floor(Math.random() * (maxRadius - 3)) + 3;

            for (let y = cy - currentRadius; y <= cy + currentRadius; y++) {
                for (let x = cx - currentRadius; x <= cx + currentRadius; x++) {
                    if (x >= 0 && x < width && y >= 0 && y < height) {
                        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
                        if (dist <= currentRadius) {
                            this.map[y][x] = type;
                        }
                    }
                }
            }
        }
        return this.map;
    }

    get() {
        return this.map;
    }
}

module.exports = Map;
