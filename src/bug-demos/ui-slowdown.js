const {
    Border,
    Text,
    UIElement,
    VerticalBox,
    Vector,
    globalEvents,
    world,
} = require("@tabletop-playground/api");

const panel = new VerticalBox();
const ui = new UIElement();
ui.width = 100;
ui.height = 100;
ui.useWidgetSize = false;
ui.position = new Vector(0, 0, world.getTableHeight() + 6);
ui.widget = new Border().setChild(panel);
world.addUI(ui);

const text = new Text();

let frameCount = 0;
let totalSeconds = 0;
const reportN = 100;
globalEvents.onTick.add((prevTickDurationSecs) => {
    frameCount += 1;
    totalSeconds += prevTickDurationSecs;
    if (frameCount >= reportN) {
        console.log(`frame time ${(totalSeconds / reportN) * 1000} msecs`);
        frameCount = 0;
        totalSeconds = 0;
    }
    panel.removeAllChildren();
    panel.addChild(text.setText(`${frameCount}`)); // what if recycle old text?
});
