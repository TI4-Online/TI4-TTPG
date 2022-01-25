const { ObjectNamespace } = require("./object-namespace");

class ReturnGameObjectHome {
    /**
     * Static-only class, do not instantiate it.
     * @throws always
     */
    constructor() {
        throw new Error('Static only')
    }

    /**
     * Attempts to return all given objects home
     * @param {GameObject[]} gameObjects Objects to return home
     * @returns Array of returns from return method on each object
     */
    static returnAll(gameObjects) {
        return gameObjects.forEach(gameObject => ReturnGameObjectHome.return(gameObject))
    }

    /**
     * Attempts to return the given game object home
     * @param {GameObject} gameObject Object to return home
     * @returns Return from the relevent returnX method
     * @throws if gameObject is of unrecognised type
     */
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
