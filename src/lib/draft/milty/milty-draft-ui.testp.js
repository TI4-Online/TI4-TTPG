const { DEFAULT_SLICE_SCALE } = require("./milty-slice-ui");
const { MiltyDraftUI } = require("./milty-draft-ui");
const { UIElement, Vector, refObject } = require("../../../wrapper/api");

const miltyDraftWidget = new MiltyDraftUI();

const ui = new UIElement();
ui.position = new Vector(0, 0, 3);
ui.widget = miltyDraftWidget;
ui.scale = 1 / DEFAULT_SLICE_SCALE;

refObject.addUI(ui);
