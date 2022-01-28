const GameObject = require('./mock-game-object')

class Container extends GameObject {
    constructor(data) {
        super(data)
    }
}

module.exports = Container