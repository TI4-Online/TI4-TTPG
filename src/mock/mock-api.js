// Export under the mock names so tests can be explicit they are not using TTPG objects.
Object.assign(module.exports, {
    MockButton: require("./mock-button"),
    MockCard: require("./mock-card"),
    MockCardDetails: require("./mock-card-details"),
    MockColor: require("./mock-color"),
    MockContainer: require("./mock-container"),
    MockDice: require("./mock-dice"),
    MockGameObject: require("./mock-game-object"),
    MockGameWorld: require("./mock-game-world"),
    MockGlobalScriptingEvents: require("./mock-global-scripting-events"),
    MockPlayer: require("./mock-player"),
    MockRotator: require("./mock-rotator"),
    MockTextWidgetBase: require("./mock-text-widget-base"),
    MockUIElement: require("./mock-ui-element"),
    MockVector: require("./mock-vector"),
});

// Export under the TTPG api names for unaware consumers.
Object.assign(module.exports, {
    Button: module.exports.MockButton,
    Card: module.exports.MockCard,
    CardDetails: module.exports.MockCardDetails,
    Color: module.exports.MockColor,
    Container: module.exports.MockContainer,
    Dice: module.exports.MockDice,
    GameObject: module.exports.MockGameObject,
    GameWorld: module.exports.MockGameWorld,
    GlobalScriptingEvents: module.exports.MockGlobalScriptingEvents,
    Player: module.exports.MockPlayer,
    Rotator: module.exports.MockRotator,
    TextWidgetBase: module.exports.MockTextWidgetBase,
    UIElement: module.exports.MockUIElement,
    Vector: module.exports.MockVector,
});

// SHARE global objects.
const globalEvents = new module.exports.GlobalScriptingEvents();
const world = new module.exports.GameWorld();

// Create TTPG runtime objects.
Object.assign(module.exports, {
    globalEvents,
    world,
});
