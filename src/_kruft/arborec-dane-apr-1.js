const {
    LayoutBox,
    Text,
    UIElement,
    UIZoomVisibility,
    Vector,
    VerticalBox,
    refObject,
    refPackageId,
} = require("../wrapper/api");

const UI_SCALE = 8;

const nameText = new Text()
    .setFontSize(2 * UI_SCALE)
    .setFont("handel-gothic-regular.ttf", refPackageId)
    .setText("PLANT STUFF");

const descText = new Text()
    .setFontSize(2 * UI_SCALE)
    .setFont("myriad-pro-semibold.ttf", refPackageId)
    .setText("U only need 9 VP to win.")
    .setAutoWrap(true);

const descIndent = new LayoutBox()
    .setPadding(1.7 * UI_SCALE, 0, 0, 0)
    .setOverrideWidth(56 * UI_SCALE)
    .setChild(descText);

const widget = new VerticalBox().addChild(nameText).addChild(descIndent);

const z = refObject.getExtent().z + 0.1;

const ui = new UIElement();
ui.anchorX = 0;
ui.anchorY = 1;
ui.position = new Vector(1.6, 7.65, z);
ui.scale = 1 / UI_SCALE;
ui.widget = widget;
ui.zoomVisibility = UIZoomVisibility.Both;
refObject.addUI(ui);
