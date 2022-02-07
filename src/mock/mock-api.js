// Export under the mock names so tests can be explicit they are not using TTPG objects.
Object.assign(module.exports, {
    MockBorder: require("./mock-border"),
    MockButton: require("./mock-button"),
    MockCard: require("./mock-card"),
    MockCardDetails: require("./mock-card-details"),
    MockContainer: require("./mock-container"),
    MockGameObject: require("./mock-game-object"),
    MockGameWorld: require("./mock-game-world"),
    MockGlobalScriptingEvents: require("./mock-global-scripting-events"),
    MockPlayer: require("./mock-player"),
    MockRotator: require("./mock-rotator"),
    MockUIElement: require("./mock-ui-element"),
    MockVector: require("./mock-vector"),
    MockVerticalBox: require("./mock-vertical-box"),
});

// Export under the TTPG api names for unaware consumers.
Object.assign(module.exports, {
    Border: module.exports.MockBorder,
    Button: module.exports.MockButton,
    Card: module.exports.MockCard,
    CardDetails: module.exports.MockCardDetails,
    Container: module.exports.MockContainer,
    GameObject: module.exports.MockGameObject,
    GameWorld: module.exports.MockGameWorld,
    GlobalScriptingEvents: module.exports.MockGlobalScriptingEvents,
    Player: module.exports.MockPlayer,
    Rotator: module.exports.MockRotator,
    UIElement: module.exports.MockUIElement,
    Vector: module.exports.MockVector,
    VerticalBox: module.exports.MockVerticalBox
});

// SHARE global objects.
const globalEvents = new module.exports.GlobalScriptingEvents();
const world = new module.exports.GameWorld();

// Create TTPG runtime objects.
Object.assign(module.exports, {
    globalEvents,
    world,
});
