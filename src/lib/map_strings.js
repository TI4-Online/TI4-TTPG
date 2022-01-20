const validate = function (mapString) {
    return /^\s*(?:\{\d+\})?(?:\s*,?\s*\d+(?:[abAB]\d)?)+\s*$/.test(mapString)
}

const parse = function (mapString) {
    if (!validate(mapString)) {
        throw new Error('Invalid map string')
    }
    const tiles = Array.from(mapString.matchAll(/\{?(?<tile>\d+)\}?(?:(?<side>[abAB])(?<rotation>\d))?/g)).map(match => {
        const tile = { tile: parseInt(match.groups.tile) }
        if(match.groups.side) {
            tile.side = match.groups.side.toLowerCase();
            tile.rotation = parseInt(match.groups.rotation);
        }
        return tile;
    })

    if (!mapString.startsWith('{') && tiles[0].tile !== 18) {
        tiles.unshift({ tile: 18 });
    }
    return tiles;
}

const format = function (mapTiles) {
    mapTiles = mapTiles.slice()
    const centerTile = mapTiles.shift();
    let centerTileString = '';
    if (centerTile.tile != 18) {
        centerTileString = '{' + centerTile.tile + '} '
    }
    return centerTileString + mapTiles.map(tile => [tile.tile, tile.side, tile.rotation].join('')).join(' ')
}

const normalize = function (mapString) {
    return format(parse(mapString))
}

module.exports = {
    validate,
    parse,
    format,
    normalize
}