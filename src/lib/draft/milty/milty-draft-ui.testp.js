const { DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const { MiltyDraftUI } = require("./milty-draft-ui");
const {
    Border,
    UIElement,
    Vector,
    refObject,
} = require("../../../wrapper/api");

const miltyDraftWidget = new MiltyDraftUI();

const ui = new UIElement();
ui.position = new Vector(0, 0, 3);
ui.widget = new Border().setColor([0.5, 0.5, 0.5]).setChild(miltyDraftWidget);
ui.scale = 1 / DEFAULT_SLICE_SCALE;

refObject.addUI(ui);
