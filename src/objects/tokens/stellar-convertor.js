const { refObject, world, GameObject, Vector } = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");
const locale = require("../../lib/locale");
const { getClosestPlanet } = require("../../lib/system/position-to-planet");
const assert = require("../../wrapper/assert-wrapper");

let _stellarConvertorTileNumber = 0;
let _stellarConvertorPlanet = "";

function unStellarConvertPlanet() {
    if (_stellarConvertorTileNumber) {
        const prevSystem = world.TI4.getSystemByTileNumber(
            _stellarConvertorTileNumber
        );

        for (const planet of prevSystem.planets) {
            console.log(planet.localeName);
            if (planet.localeName === _stellarConvertorPlanet) {
                planet.destroyed = false;
                break;
            }
        }

        _stellarConvertorTileNumber = 0;
        _stellarConvertorPlanet = "";
    }
}

function stellarConvertPlanet(obj) {
    assert(obj instanceof GameObject);
    const pos = obj.getPosition();
    const planet = getClosestPlanet(pos);
    if (planet) {
        unStellarConvertPlanet();

        const message = locale("ui.message.stellar_convertor", {
            planetName: planet.getNameStr(),
        });
        Broadcast.chatAll(message);

        planet.destroyed = true;

        _stellarConvertorPlanet = planet.localeName;
        _stellarConvertorTileNumber = planet.system.tile;

        const systemObject = world.TI4.getSystemTileObjectByPosition(pos);
        const attachmentPosition = systemObject
            .localPositionToWorld(planet.position)
            .add(new Vector(0, 0, systemObject.getSize().z));

        obj.setPosition(attachmentPosition);
        obj.setScale(systemObject.getScale());
        obj.setObjectType(1); // ground i.e. locked
    }
}

refObject.onReleased.add(stellarConvertPlanet);
refObject.onGrab.add(unStellarConvertPlanet);
refObject.onCreated.add(stellarConvertPlanet);

if (world.getExecutionReason() === "ScriptReload") {
    stellarConvertPlanet(refObject);
}
