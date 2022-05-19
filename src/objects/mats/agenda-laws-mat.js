const assert = require("../../wrapper/assert-wrapper");
const { ObjectSavedData } = require("../../lib/saved-data/object-saved-data");
const {
    GameObject,
    Vector,
    ZonePermission,
    globalEvents,
    refObject,
    world,
} = require("../../wrapper/api");
const { ObjectNamespace } = require("../../lib/object-namespace");

const ZONE = {
    X: 5,
    Y: 7,
    Z: 2,
};

// place cards on game setup
class AgendaLawsMat {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._zone = undefined;

        this._obj.onDestroyed.add(() => {
            this._destroyZone();
        });
        this._obj.onGrab.add(() => {
            this._destroyZone();
        });

        this._obj.onReleased.add(() => {
            this._createZone();
        });
        this._obj.onMovementStopped.add(() => {
            this._createZone();
        });

        this._createZone();
    }

    _destroyZone() {
        // On refresh zone persists but this._zone does not.  Search for zone.
        const zoneId = ObjectSavedData.get(this._obj, "zoneId", undefined);
        if (zoneId === undefined) {
            return; // no zone yet
        }
        for (const zone of world.getAllZones()) {
            if (zone.getSavedData() === zoneId) {
                zone.destroy();
            }
        }
        this._zone = undefined;
    }

    _createZone() {
        this._destroyZone();

        let zoneId = ObjectSavedData.get(this._obj, "zoneId", undefined);
        if (zoneId === undefined) {
            zoneId = `zone:${this._obj.getId()}`;
            ObjectSavedData.set(this._obj, "zoneId", zoneId);
        }

        const snapPoints = this._obj.getAllSnapPoints();
        const snapPoint = snapPoints[5];

        const zoneScale = new Vector(ZONE.X, ZONE.Y, ZONE.Z);
        const zonePos = snapPoint.getGlobalPosition();
        zonePos.z = world.getTableHeight();
        this._zone = world.createZone(zonePos);
        this._zone.setSavedData(zoneId);
        this._zone.setRotation(this._obj.getRotation());
        this._zone.setScale(zoneScale);
        this._zone.setStacking(ZonePermission.Nobody);
        this._zone.setColor([1, 0, 0, 0.1]);
        this._zone.setAlwaysVisible(false);
        this._zone.onBeginOverlap.add((zone, obj) => {
            this._triggerEvent();
        });
        this._zone.onEndOverlap.add((zone, obj) => {
            this._triggerEvent();
        });
    }

    _triggerEvent() {
        let agendaCards = this._zone.getOverlappingObjects();
        if (!agendaCards) {
            return;
        }

        agendaCards = agendaCards.filter((obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            return nsid.startsWith("card.agenda");
        });
        if (agendaCards.length > 1) {
            return;
        }

        const agendaCard = agendaCards[0];
        const nsid = agendaCard
            ? ObjectNamespace.getNsid(agendaCard)
            : "<none>";
        console.log(`AgendaLawsMat.onAgendaChanged ${nsid}`);
        globalEvents.TI4.onAgendaChanged.trigger(agendaCard);
    }
}

refObject.onCreated.add((obj) => {
    new AgendaLawsMat(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new AgendaLawsMat(refObject);
}
