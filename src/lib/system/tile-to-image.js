const assert = require("../../wrapper/assert-wrapper");
const { world } = require("../../wrapper/api");

// Could probably do this programmatically
const TILE_TO_IMAGE = {
    1: "locale/tiles/base/homeworld/tile_001.jpg",
    2: "locale/tiles/base/homeworld/tile_002.jpg",
    3: "locale/tiles/base/homeworld/tile_003.jpg",
    4: "locale/tiles/base/homeworld/tile_004.jpg",
    5: "locale/tiles/base/homeworld/tile_005.jpg",
    6: "locale/tiles/base/homeworld/tile_006.jpg",
    7: "locale/tiles/base/homeworld/tile_007.jpg",
    8: "locale/tiles/base/homeworld/tile_008.jpg",
    9: "locale/tiles/base/homeworld/tile_009.jpg",
    10: "locale/tiles/base/homeworld/tile_010.jpg",
    11: "locale/tiles/base/homeworld/tile_011.jpg",
    12: "locale/tiles/base/homeworld/tile_012.jpg",
    13: "locale/tiles/base/homeworld/tile_013.jpg",
    14: "locale/tiles/base/homeworld/tile_014.jpg",
    15: "locale/tiles/base/homeworld/tile_015.jpg",
    16: "locale/tiles/base/homeworld/tile_016.jpg",
    17: "locale/tiles/base/homeworld/tile_017.jpg",
    18: "locale/tiles/base/special/tile_018.jpg",
    19: "locale/tiles/base/regular/tile_019.jpg",
    20: "locale/tiles/base/regular/tile_020.jpg",
    21: "locale/tiles/base/regular/tile_021.jpg",
    22: "locale/tiles/base/regular/tile_022.jpg",
    23: "locale/tiles/base/regular/tile_023.jpg",
    24: "locale/tiles/base/regular/tile_024.jpg",
    25: "locale/tiles/base/regular/tile_025.jpg",
    26: "locale/tiles/base/regular/tile_026.jpg",
    27: "locale/tiles/base/regular/tile_027.jpg",
    28: "locale/tiles/base/regular/tile_028.jpg",
    29: "locale/tiles/base/regular/tile_029.jpg",
    30: "locale/tiles/base/regular/tile_030.jpg",
    31: "locale/tiles/base/regular/tile_031.jpg",
    32: "locale/tiles/base/regular/tile_032.jpg",
    33: "locale/tiles/base/regular/tile_033.jpg",
    34: "locale/tiles/base/regular/tile_034.jpg",
    35: "locale/tiles/base/regular/tile_035.jpg",
    36: "locale/tiles/base/regular/tile_036.jpg",
    37: "locale/tiles/base/regular/tile_037.jpg",
    38: "locale/tiles/base/regular/tile_038.jpg",
    51: "locale/tiles/base/special/tile_051.jpg",
    52: "locale/tiles/pok/homeworld/tile_052.jpg",
    53: "locale/tiles/pok/homeworld/tile_053.jpg",
    54: "locale/tiles/pok/homeworld/tile_054.jpg",
    55: "locale/tiles/pok/homeworld/tile_055.jpg",
    56: "locale/tiles/pok/homeworld/tile_056.jpg",
    57: "locale/tiles/pok/homeworld/tile_057.jpg",
    58: "locale/tiles/pok/homeworld/tile_058.jpg",
    59: "locale/tiles/pok/regular/tile_059.jpg",
    60: "locale/tiles/pok/regular/tile_060.jpg",
    61: "locale/tiles/pok/regular/tile_061.jpg",
    62: "locale/tiles/pok/regular/tile_062.jpg",
    63: "locale/tiles/pok/regular/tile_063.jpg",
    64: "locale/tiles/pok/regular/tile_064.jpg",
    65: "locale/tiles/pok/regular/tile_065.jpg",
    66: "locale/tiles/pok/regular/tile_066.jpg",
    67: "locale/tiles/pok/hazard/tile_067.jpg",
    68: "locale/tiles/pok/hazard/tile_068.jpg",
    69: "locale/tiles/pok/regular/tile_069.jpg",
    70: "locale/tiles/pok/regular/tile_070.jpg",
    71: "locale/tiles/pok/regular/tile_071.jpg",
    72: "locale/tiles/pok/regular/tile_072.jpg",
    73: "locale/tiles/pok/regular/tile_073.jpg",
    74: "locale/tiles/pok/regular/tile_074.jpg",
    75: "locale/tiles/pok/regular/tile_075.jpg",
    76: "locale/tiles/pok/regular/tile_076.jpg",
};

class TileToImage {
    constructor() {
        throw new Error("static only");
    }

    static tileToImage(tile) {
        assert(typeof tile === "number");

        const system = world.TI4.getSystemByTileNumber(tile);
        const source = system.raw.source;
        let type = "regular";
        if (system.raw.offMap || tile === 18) {
            type = "special";
        } else if (system.home) {
            type = "homeworld";
        } else if (system.raw.anomalies && system.raw.anomalies.length > 0) {
            type = "hazard";
        }
        const tileStr = tile.toString().padStart(3, "0");
        return `locale/tiles/${source}/${type}/tile_${tileStr}.jpg`;
    }
}

module.exports = { TileToImage, TILE_TO_IMAGE };
