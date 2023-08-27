const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ObjectSavedData } = require("../../lib/saved-data/object-saved-data");
const { OUTCOME_TYPE } = require("../../lib/agenda/agenda-outcome");
const {
    GameObject,
    Rotator,
    Vector,
    ZonePermission,
    globalEvents,
    refObject,
    world,
} = require("../../wrapper/api");
const { PopupPanel } = require("../../lib/ui/popup-panel");

const ZONE = {
    X: 5,
    Y: 7,
    Z: 20,
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

        this._addShortcutPopup();
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
            this._triggerEvent(obj, true);
        });
        this._zone.onEndOverlap.add((zone, obj) => {
            this._triggerEvent(obj, false);
        });
    }

    _triggerEvent(movingObject, isEntering) {
        assert(movingObject instanceof GameObject);
        assert(typeof isEntering === "boolean");

        // Ignore non-agendas moving into/out of zone.
        const movingObjectNsid = ObjectNamespace.getNsid(movingObject);
        if (!movingObjectNsid.startsWith("card.agenda")) {
            return;
        }

        const overlapping = this._zone.getOverlappingObjects() || [];
        const agendaCards = overlapping.filter((obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            return nsid.startsWith("card.agenda");
        });

        // First agenda entered?
        if (isEntering && agendaCards.length === 1) {
            const agendaCard = agendaCards[0];
            const nsid = ObjectNamespace.getNsid(agendaCard);
            console.log(`AgendaLawsMat.onAgendaChanged ${nsid}`);
            globalEvents.TI4.onAgendaChanged.trigger(agendaCard);
        }

        // Last agenda left?
        if (!isEntering && agendaCards.length === 0) {
            console.log(`AgendaLawsMat.onAgendaChanged <none>`);
            globalEvents.TI4.onAgendaChanged.trigger(undefined);
        }
    }

    _addShortcutPopup() {
        const options = [
            {
                label: locale("ui.agenda.outcome_type.for_against"),
                outcomeType: OUTCOME_TYPE.FOR_AGAINST,
            },
            {
                label: locale("ui.agenda.outcome_type.player"),
                outcomeType: OUTCOME_TYPE.PLAYER,
            },
            {
                label: locale("ui.agenda.outcome_type.strategy_card"),
                outcomeType: OUTCOME_TYPE.STRATEGY_CARD,
            },
            {
                label: locale("ui.agenda.outcome_type.other"),
                outcomeType: OUTCOME_TYPE.OTHER,
            },
        ];

        const localPos = new Vector(11.3, -0.4, 0.14); // model is rotated (should really fix that)
        const localRot = new Rotator(0, 90, 0);
        const popupPanel = new PopupPanel(this._obj, localPos, localRot);

        for (const option of options) {
            popupPanel.addAction(option.label, () => {
                world.TI4.agenda.externalSetOutcomeType(option.outcomeType);
            });
        }

        popupPanel.attachPopupButton();
    }
}

refObject.onCreated.add((obj) => {
    new AgendaLawsMat(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new AgendaLawsMat(refObject);
}
