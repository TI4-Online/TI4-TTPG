const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

// Export under the mock names so tests can be explicit they are not using TTPG objects.
Object.assign(module.exports, {
    MockBorder: require("./mock-border"),
    MockButton: require("./mock-button"),
    MockCard: require("./mock-card"),
    MockCardDetails: require("./mock-card-details"),
    MockCheckBox: require("./mock-check-box"),
    MockColor: require("./mock-color"),
    MockContainer: require("./mock-container"),
    MockDice: require("./mock-dice"),
    MockGameObject: require("./mock-game-object"),
    MockGameWorld: require("./mock-game-world"),
    MockGlobalScriptingEvents: require("./mock-global-scripting-events"),
    MockPlayer: require("./mock-player"),
    MockRotator: require("./mock-rotator"),
    MockSlider: require("./mock-slider"),
    MockText: require("./mock-text"),
    MockTextWidgetBase: require("./mock-text-widget-base"),
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
    CheckBox: module.exports.MockCheckBox,
    Color: module.exports.MockColor,
    Container: module.exports.MockContainer,
    Dice: module.exports.MockDice,
    GameObject: module.exports.MockGameObject,
    GameWorld: module.exports.MockGameWorld,
    GlobalScriptingEvents: module.exports.MockGlobalScriptingEvents,
    Player: module.exports.MockPlayer,
    Rotator: module.exports.MockRotator,
    Slider: module.exports.MockSlider,
    Text: module.exports.MockText,
    TextWidgetBase: module.exports.MockTextWidgetBase,
    UIElement: module.exports.MockUIElement,
    Vector: module.exports.MockVector,
    VerticalBox: module.exports.MockVerticalBox,
});

// SHARE global objects.
const globalEvents = new module.exports.GlobalScriptingEvents();
const world = new module.exports.GameWorld();

// 'refObject' is tricky, it should be per-object and potentially meaningful.
// Create a dummy catch-all, specific tests can override if needed.
const refObject = new module.exports.GameObject();

// Register TI4 events.
globalEvents.TI4 = {
    onContainerRejected: new TriggerableMulticastDelegate(),
    onFactionChanged: new TriggerableMulticastDelegate(),
    onSystemActivated: new TriggerableMulticastDelegate(),
    onStrategyCardPlayed: new TriggerableMulticastDelegate(),
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(),
};

// Create TTPG runtime objects.
Object.assign(module.exports, {
    refObject,
    globalEvents,
    world,
});
