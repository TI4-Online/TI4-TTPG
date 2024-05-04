const { Card, CardHolder, world } = require("../wrapper/api");

function resetCards(cardHolder) {
    // Extrude the cardholder extent for the overlap box.
    const currentRotation = false;
    const includeGeometry = false;
    const boxExtent = cardHolder.getExtent(currentRotation, includeGeometry);
    boxExtent.z = 3;
    const boxPos = cardHolder.getPosition();
    const boxRot = cardHolder.getRotation();
    //world.drawDebugBox(boxPos, boxExtent, boxRot, [1, 0, 0, 1], 3);
    for (const obj of world.boxOverlap(boxPos, boxExtent, boxRot)) {
        if (!(obj instanceof Card)) {
            continue;
        }
        if (obj.getHolder()) {
            continue; // card is already in a holder
        }
        cardHolder.insert(obj);
    }
}

console.log("card-holder-reset-cards-on-load.js loaded.");
process.nextTick(() => {
    for (const obj of world.getAllObjects()) {
        if (obj instanceof CardHolder) {
            resetCards(obj);
        }
    }
});
