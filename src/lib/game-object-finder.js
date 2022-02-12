
const { world } = require('@tabletop-playground/api')
const { find, get, set } = require('../wrapper/lodash-wrapper')

class GameObjectFinder {

    static playerObjects = {}

    static clearCache() {
        GameObjectFinder.playerObjects = {}
    }

    static getPlayerUnitBag(playerSlot, unitMetadata) {
        const key = GameObjectFinder._playerUnitBagKey(playerSlot, unitMetadata)
        const bag = get(GameObjectFinder.playerObjects, key)

        if(bag) {
            return bag
        }

        const found = GameObjectFinder._findPlayerObject(playerSlot, `bag.${unitMetadata}`)

        set(GameObjectFinder.playerObjects, key, found)

        return found
    }

    static _findPlayerObject(playerSlot, objectMetaData) {
        return find(world.getAllObjects(), (gameObject) => {
            return gameObject.getTemplateMetadata() === objectMetaData
                && gameObject.getOwningPlayerSlot() === playerSlot
        })
    }

    static _playerUnitBagKey(playerSlot, unitMetadata) {
        return `${playerSlot}.unitBag.${unitMetadata}`
    }
}

module.exports = GameObjectFinder
