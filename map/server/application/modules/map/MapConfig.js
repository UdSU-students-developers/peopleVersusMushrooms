class MAP_CONFIG { 
    
    // Константы
    static TILES = {
        PLANE: 0,
        WATER: 1,
        MOUNTAIN: 2
    }

    static DEFAULTS = {
        WATER: 50,
        MOUNTAIN: 50,
        IRON: 2,
        OIL: 2,
        SEED: 1
    }

    static SATURATION = {
        IRON: 1,
        OIL: 1
    }

    // Типы элементов карты
    static UNIT_TYPES = {

    }

    static BUILDING_TYPES = {

    }

    static SOURCE_TYPES = {
        IRON: 'ironSource',
        OIL: 'oilSource',
    }
}

module.exports = MAP_CONFIG;