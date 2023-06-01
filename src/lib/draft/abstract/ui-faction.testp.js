const { UiFaction } = require("./ui-faction");
const { Border, UIElement, refObject } = require("../../../wrapper/api");

const uiFaction = new UiFaction().setFactionNsidName("arborec");

const size = uiFaction.getSize();
console.log(JSON.stringify(size));

const widget = uiFaction.createWidget();

const ui = new UIElement();
ui.position = [0, 0, 0.26];
ui.scale = 1;
ui.widget = new Border().setChild(widget);

refObject.addUI(ui);
