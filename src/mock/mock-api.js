// Export under the mock names so tests can be explicit they are not using TTPG objects.
Object.assign(module.exports, {
    MockCard : require('./mock-card'),
    MockCardDetails : require('./mock-card-details'),
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
    CardDetails : module.exports.MockCardDetails,
    GameObject : module.exports.MockGameObject,
    GameWorld : module.exports.MockGameWorld,
    GlobalScriptingEvents : module.exports.MockGlobalScriptingEvents,
    Player : module.exports.MockPlayer,
    Rotator : module.exports.MockRotator,
    Vector : module.exports.MockVector,
})

// SHARE global objects.
const globalEvents = new module.exports.GlobalScriptingEvents()
const world = new module.exports.GameWorld()

// Create TTPG runtime objects.
Object.assign(module.exports, {
    globalEvents,
    world,
})
