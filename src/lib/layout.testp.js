const { Layout } = require("./layout");
const {
    ObjectType,
    Vector,
    globalEvents,
    refObject,
    world,
} = require("@tabletop-playground/api");

const ACTION = {
    CREATE_MARKER: "*Create marker",
    LAYOUT_LINEAR: "*Linear",
    LAYOUT_ARC: "*Arc",
    STOP_LAYOUT: "*Stop layout",
};

const MARKER_TEMPLATE_ID = "E10BD70A49A3A579382262A507FC8A35";
const MARKER_GUID = "__layoutMarker__";
let _layout = false;
let _layoutMode = false;

const LAYOUT = {
    units: {
        count: 12,
        distance: 5.5,
    },
    supplyLeft: {
        count: 5,
        distance: 12,
    },
    supplyRight: {
        count: 3,
        distance: 12,
    },
    tokensRight: {
        count: 2,
        distance: 5.5,
    },
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.CREATE_MARKER) {
        const pos = new Vector(0, 0, world.getTableHeight());
        const marker = world.createObjectFromTemplate(MARKER_TEMPLATE_ID, pos);
        marker.setId(MARKER_GUID);
        marker.setObjectType(ObjectType.Penetrable);
    } else if (actionName === ACTION.LAYOUT_LINEAR) {
        // Marker is on layout path.
        const marker = world.getObjectById(MARKER_GUID);
        const forward = obj
            .getPosition()
            .findLookAtRotation(marker.getPosition());
        _layout = new Layout()
            .setCenter(marker.getPosition())
            .setCount(LAYOUT.units.count)
            .setDistanceBetween(LAYOUT.units.distance)
            .layoutLinear(forward.yaw)
            .drawDebug();
        _layoutMode = actionName;
    } else if (actionName === ACTION.LAYOUT_ARC) {
        // Marker is on layout path.
        const marker = world.getObjectById(MARKER_GUID);
        const arcOrigin = obj.getPosition();
        _layout = new Layout()
            .setCenter(marker.getPosition())
            .setCount(LAYOUT.units.count)
            .setDistanceBetween(LAYOUT.units.distance)
            .layoutArc(arcOrigin)
            .drawDebug();
        _layoutMode = actionName;
    } else if (actionName === ACTION.STOP_LAYOUT) {
        console.log(_layout.getPoints());
        for (const point of _layout.getPoints()) {
            console.log(point.pos.subtract([-129.4, 0, 0]));
        }

        _layout = false;
        _layoutMode = false;

        const shelfCenter = world
            .getObjectById(MARKER_GUID)
            .getPosition()
            .subtract([-129.4, 0, 0]);
        const arcOrigin = obj.getPosition().subtract([-129.4, 0, 0]);
        console.log(`shelfCenter: ${shelfCenter} arcOrigin: ${arcOrigin}`);
    }
});

globalEvents.onTick.add((msecs) => {
    if (_layout) {
        if (_layoutMode == ACTION.LAYOUT_LINEAR) {
            const marker = world.getObjectById(MARKER_GUID);
            const forward = refObject
                .getPosition()
                .findLookAtRotation(marker.getPosition());
            _layout
                .setCenter(marker.getPosition())
                .layoutLinear(forward.yaw)
                .drawDebug();
        } else if (_layoutMode == ACTION.LAYOUT_ARC) {
            const marker = world.getObjectById(MARKER_GUID);
            const arcOrigin = refObject.getPosition();
            _layout
                .setCenter(marker.getPosition())
                .layoutArc(arcOrigin)
                .drawDebug();
        }
    }
});
