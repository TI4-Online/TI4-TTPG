// Export under the mock names so tests can be explicit they are not using TTPG objects.
Object.assign(module.exports, {
    MockCard : require('./mock-card'),
    MockGameObject : require('./mock-game-object'),
    MockGameWorld : require('./mock-game-world'),
    MockGlobalScriptingEvents : require('./mock-global-scripting-events'),
    MockPlayer : require('./mock-player'),
    MockRotator : require('./mock-rotator'),
    MockVector : require('./mock-vector'),
})

// Export under the TTPG api names for unaware consumers.
Object.assign(module.exports, {
    Card : module.exports.MockCard,
    GameObject : module.exports.MockGameObject,
    GameWorld : module.exports.MockGameWorld,
    GlobalScriptingEvents : module.exports.MockGlobalScriptingEvents,
    Player : module.exports.MockPlayer,
    Rotator : module.exports.MockRotator,
    Vector : module.exports.MockVector,
})

// Create TTPG runtime objects.
Object.assign(module.exports, {
    world : new module.exports.GameWorld(),
    globalEvents : new module.exports.GlobalScriptingEvents(),
})
