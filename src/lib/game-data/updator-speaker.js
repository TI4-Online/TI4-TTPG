const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = (data) => {
    data.speaker = "";

    let speakerToken = undefined;
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid === "token:base/speaker") {
            speakerToken = obj;
            break;
        }
    }

    // Abort if sus.
    if (!speakerToken) {
        return;
    }

    const pos = speakerToken.getPosition();
    const desk = world.TI4.getClosestPlayerDesk(pos);

    data.speaker = capitalizeFirstLetter(desk.colorName);
};
