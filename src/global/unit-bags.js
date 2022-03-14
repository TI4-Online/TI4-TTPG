/*
 * Generic Scripting for Unit Containers.
 *
 * Any unit container will get an UI displaying its current and max content (plastic minis).
 */

const {
    Border,
    Color,
    UIElement,
    Vector,
    globalEvents,
    refPackageId,
    world,
} = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

const boxHeight = 14;
const boxWidth = 4;
const spacing = 5;
const xPos = -3.5;
const factor = 16;
const yStep = (boxWidth + spacing) / factor;

function setupUnitBag(bag) {
    const maxItems = bag.getMaxItems();

    if (maxItems > 9) {
        // not configured unit bag or units which can be substituted by tokens
        return;
    }

    bag.getUIs().forEach((ui) => bag.removeUI(ui));

    const yStart = -0.5 * (maxItems - 1) * yStep;

    for (let x = 0; x < maxItems; x++) {
        let uiElement = new UIElement();
        uiElement.useWidgetSize = false;
        uiElement.height = boxHeight;
        uiElement.width = boxWidth;
        const yPos = yStart + x * yStep;
        uiElement.position = new Vector(xPos, yPos, 0.1);
        uiElement.widget = new LayoutBox()
            .setMinimumWidth(boxWidth)
            .setMinimumHeight(boxHeight)
            .setChild(new Border());
        bag.addUI(uiElement);
    }

    updateItemCount(bag);
    bag.onInserted.add(updateItemCount);
    bag.onRemoved.add(updateItemCount);
}

function updateItemCount(bag) {
    console.log(bag);
    const currentNumber = bag.getNumItems();

    bag.getUIs().forEach((ui, index) => {
        const color =
            index < currentNumber
                ? bag.getPrimaryColor()
                : new Color(0.2, 0.2, 0.2);
        ui.widget.getChild().setColor(color, refPackageId);
    });
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isUnitBag(obj)) {
        setupUnitBag(obj);
    }
});

const initUnitBags = () => {
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isUnitBag(obj)) {
            setupUnitBag(obj);
        }
    }
};

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    initUnitBags();
}

globalEvents.TI4.onPlayerColorChanged.add(initUnitBags);
