const MECATOL_REX_SYSTEM_TILE = 18;

/**
 * Validates a map string and can be parsed.
 *
 * The input format can be one of the following:
 * - 7 16 23 (normal)
 * - {4} 7 16 23 (use 4 instead of Mecatol as center)
 * - 7 83b2
 *
 * Delimiters can be either one comma with/or any amount of spaces
 * Leading and trailing spacesare ignored
 * @param {string} mapString A map string
 * @returns {boolean} true if the map string is valid and can be parsed, otherwise false
 */
const validate = function (mapString) {
    return /^\s*(?:\{[-]*\d+([abAB]\d)*\})?(?:\s*,?\s*[-]*\d+(?:[abAB]\d)?)*\s*$/.test(
        mapString
    );
};

/**
 * Parses a map string to an array of objects.
 * If there is no center tile replacement Mecatol is inserted as the first element.
 *
 * The input format can be one of the following:
 * - 7 16 23 (normal)
 * - {4} 7 16 23 (use 4 instead of Mecatol as center)
 * - 7 83b2
 *
 * Delimiters can be either one comma with/or any amount of spaces
 * Leading and trailing spacesare ignored
 * @param {string} mapString A map string
 * @returns {({ tile: number} | { tile: number, side: 'a'|'b', rotation: number }[])} A list of objects representing the parsed tiles
 */
const parse = function (mapString) {
    if (!validate(mapString)) {
        throw new Error("Invalid map string");
    }
    const tiles = Array.from(
        mapString.matchAll(
            /\{?(?<tile>[-]*\d+)\}?(?:(?<side>[abAB])(?<rotation>\d))?/g
        )
    ).map((match) => {
        const tile = { tile: parseInt(match.groups.tile) };
        if (match.groups.side) {
            tile.side = match.groups.side.toLowerCase();
            tile.rotation = parseInt(match.groups.rotation);
        }
        return tile;
    });

    if (
        !mapString.startsWith("{") &&
        tiles[0].tile !== MECATOL_REX_SYSTEM_TILE
    ) {
        tiles.unshift({ tile: MECATOL_REX_SYSTEM_TILE });
    }
    return tiles;
};

/**
 * Formats an array of objects to a map string.
 * If the first element is Mecatol it will be ignored else a replacement expression will be created.
 *
 * The output format will be one of the following:
 * - 7 16 23 (normal)
 * - {4} 7 16 23 (use 4 instead of Mecatol as center)
 * - 7 83b2
 * @param {({ tile: number} | { tile: number, side: 'a'|'b', rotation: number }[])} mapTiles
 * @returns {string} A map string
 */
const format = function (mapTiles) {
    mapTiles = mapTiles.slice(); // copy

    // Replace any missing entries with "0".
    for (let i = 0; i < mapTiles.length; i++) {
        if (mapTiles[i] === undefined) {
            mapTiles[i] = { tile: 0 };
        }
    }

    const centerTile = mapTiles.shift();
    let centerTileString = "";
    if (centerTile.tile != MECATOL_REX_SYSTEM_TILE) {
        centerTileString =
            "{" +
            [centerTile.tile, centerTile.side, centerTile.rotation].join("") +
            "} ";
    }
    return (
        centerTileString +
        mapTiles
            .map((tile) => [tile.tile, tile.side, tile.rotation].join(""))
            .join(" ")
            .toUpperCase()
    );
};

/**
 * Normalizes a map string or another compatible format to the default format.
 *
 * The output format will be one of the following:
 * - 7 16 23 (normal)
 * - {4} 7 16 23 (use 4 instead of Mecatol as center)
 * - 7 83b2
 * @param {string} mapString A map string from or another compatible format
 * @returns {string} A map string
 */
const normalize = function (mapString) {
    return format(parse(mapString));
};

module.exports = {
    validate,
    parse,
    format,
    normalize,
};
