const { world, globalEvents, GameObject } = require("../../wrapper/api");
const { ObjectNamespace } = require("../object-namespace");
const { Explore } = require("../explore/explore");
const PositionToPlanet = require("../system/position-to-planet");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");

function shouldHaveDistantSuns(obj) {
    if (!ObjectNamespace.isUnit(obj)) {
        return false;
    }

    const unit = ObjectNamespace.parseUnit(obj);
    if (!unit.name.includes("mech")) {
        return false;
    }

    return true;
}

function addDistantSunsRightClick(obj) {
    if (shouldHaveDistantSuns(obj)) {
        removeDistantSunsRightClick(obj);
        obj.addCustomAction("*" + locale("ui.menu.distant_suns"));
        obj.onCustomAction.add((obj, player, actionName) => {
            if (actionName === "*" + locale("ui.menu.distant_suns")) {
                const pos = obj.getPosition();
                const systemTileObj =
                    world.TI4.getSystemTileObjectByPosition(pos);
                const planet = PositionToPlanet.getClosestPlanet(
                    pos,
                    systemTileObj
                );
                Broadcast.chatAll(
                    locale("ui.message.distant_suns_explore", {
                        planet: planet.getNameStr(),
                    })
                );
                Explore.doubleExplore(systemTileObj, planet, false, player);
            }
        });
    }
}

function removeDistantSunsRightClick(obj) {
    if (shouldHaveDistantSuns(obj)) {
        obj.removeCustomAction("*" + locale("ui.menu.distant_suns"));
    }
}

module.exports = { addDistantSunsRightClick, removeDistantSunsRightClick };
