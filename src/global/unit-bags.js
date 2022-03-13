/*
 * Generic Scripting for Unit Containers.
 *
 * Any unit container will get an UI displaying its current and max content (plastic minis).
 */

const {
    ImageWidget,
    Rotator,
    UIElement,
    Vector,
    refPackageId,
    world,
} = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

const boxSize = 10;

function setupUnitBag(bag) {
    const maxItems = bag.getMaxItems();

    if (maxItems === 100) {
        // not configured unit bag
        return;
    }

    // TODO: add colors
    // TODO: set the container max value according to the plastics
    
    const yStart = (1.1 + Math.min(maxItems, 3) * -0.75) * boxSize/10;

    for(let x = 0; x < maxItems; x++) {
        let uiElement = new UIElement();
        uiElement.useWidgetSize = false;
        uiElement.height = boxSize;
        uiElement.width = boxSize;
        const xPos = -3.5 + Math.floor(x/3) * -0.12 * boxSize;
        const yPos = yStart + 0.12 * (x % 3) * boxSize;
        uiElement.position = new Vector(xPos, yPos, 0.1);
        uiElement.widget = new ImageWidget()
            .setImageSize(boxSize, boxSize);
        bag.addUI(uiElement);
    }

    updateItemCount(bag);
    bag.onInserted.add(updateItemCount);
    bag.onRemoved.add(updateItemCount)
}

function updateItemCount(bag) {
    const currentNumber = bag.getNumItems();
    bag.getUIs().forEach((ui, index) => ui.widget
        .setImage(index < currentNumber ? "global/ui/contained_unit.png": "global/ui/missing_unit.png", refPackageId));
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isUnitBag(obj)) {
        setupUnitBag(obj);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isUnitBag(obj)) {
            setupUnitBag(obj);
        }
    }
}

module.exports = {
    setupStrategyCard: setupUnitBag,
};
