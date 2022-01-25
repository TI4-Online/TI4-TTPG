const { ObjectNamespace } = require("./object-namespace");

class ReturnGameObjectHome {
    /**
     * Static-only class, do not instantiate it.
     */
    constructor() {
        throw new Error('Static only')
    }

    static returnAll(gameObjects) {
        return gameObjects.forEach(gameObject => ReturnGameObjectHome.return(gameObject))
    }

    static return(gameObject) {
        if(ObjectNamespace.isCard(gameObject)) {
            return ReturnGameObjectHome.returnCard(gameObject)
        }
        if(ObjectNamespace.isCommandToken(gameObject)) {
            return ReturnGameObjectHome.returnToPlayerReinforcements(gameObject)
        }
        if(ObjectNamespace.isControlToken(gameObject)) {
            return ReturnGameObjectHome.returnToPlayerReinforcements(gameObject)
        }
        if(ObjectNamespace.isStrategyCard(gameObject)) {
            return ReturnGameObjectHome.returnStrategyCard(gameObject)
        }
        if(ObjectNamespace.isSystemTile(gameObject)) {
            return ReturnGameObjectHome.returnSystemTile(gameObject)
        }
        if(ObjectNamespace.isToken(gameObject)) {
            return ReturnGameObjectHome.returnToken(gameObject)
        }
        if(ObjectNamespace.isUnit(gameObject)) {
            return ReturnGameObjectHome.returnToPlayerReinforcements(gameObject)
        }

        throw new Error('Unable to return unknown object type')
    }

    static returnCard() {}
    static returnStrategyCard() {}
    static returnSystemTile() {}
    static returnToken() {}
    static returnToPlayerReinforcements() {}
}

module.exports = ReturnGameObjectHome;
