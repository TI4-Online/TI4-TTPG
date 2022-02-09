/**
 * Testing out camera and object movement.
 * It's possible the result looks familiar by sheer coincidence.
 */
const { Spawn } = require("../setup/spawn/spawn");
const {
    Color,
    Rotator,
    Vector,
    globalEvents,
    refObject,
    world,
} = require("../wrapper/api");

const ABOVE_Z = world.getTableHeight() + 0.4;

const WORLD = {
    nsid: "tile.system:base/18",
    scale: new Vector(5, 5, 1),
    p0: new Vector(0, 0, world.getTableHeight()),
};

const CAMERA = {
    p0: new Vector(-5, 0, ABOVE_Z + 1),
    p1: new Vector(-5, 0, ABOVE_Z),
    rot: new Rotator(10, 0, 0),
    speed: 1,
};

const LEADER = {
    nsid: "unit:base/carrier",
    scale: new Vector(1, 1, 1),
    color: new Color(1, 1, 1),
    p0: new Vector(-60, 10, world.getTableHeight() + ABOVE_Z),
    p1: new Vector(120, -20, world.getTableHeight() + ABOVE_Z),
    speed: 5,
};

const FOLLOWER = {
    nsid: "unit:base/dreadnought",
    scale: new Vector(1, 1, 1).multiply(4),
    color: new Color(1, 1, 1),
    p0: new Vector(-90, 15, world.getTableHeight() + ABOVE_Z),
    p1: new Vector(120, -20, world.getTableHeight() + ABOVE_Z),
    speed: 5,
};

const ACTION = {
    CLEAN: "*Clean objects",
    SPAWN: "*Spawn objects",
    ANIM: "*Start anim",
};

let _player = false;
let _actors = [];

class Actor {
    constructor(attrs) {
        this._attrs = attrs;
        if (this._attrs.nsid) {
            const pos = this._attrs.p0;
            let rot;
            if (this._attrs.p1) {
                rot = pos.findLookAtRotation(this._attrs.p1);
                rot = new Rotator(0, 180, 0).compose(rot);
            } else {
                rot = new Rotator(0, 0, 0);
            }
            this._obj = Spawn.spawn(this._attrs.nsid, pos, rot);
            this._obj.setScale(this._attrs.scale);
            this._obj.toggleLock();
        }
    }

    onTick(deltaTimeMsecs) {
        if (this._obj) {
            let pos = this._obj.getPosition();
            pos = Vector.interpolateToConstant(
                pos,
                this._attrs.p1,
                deltaTimeMsecs,
                this._attrs.speed
            );
            this._obj.setPosition(pos);
        } else if (_player) {
            // Moving the camera doesn't seem to work here?
            // Maybe because the camera isn't looking at the table?
            // let pos = _player.getPosition();
            // pos = Vector.interpolateToConstant(
            //     pos,
            //     this._attrs.p1,
            //     deltaTimeMsecs,
            //     this._attrs.speed
            // );
            // const rot = _player.getRotation();
            //_player.setPositionAndRotation(pos, rot);
        }
    }
}

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);
    _player = player;

    if (actionName === ACTION.CLEAN) {
        world.getAllObjects().forEach((obj) => {
            if (obj !== refObject) {
                obj.destroy();
            }
        });
        _actors = [];
    } else if (actionName === ACTION.SPAWN) {
        _actors = [
            new Actor(CAMERA),
            new Actor(WORLD),
            new Actor(LEADER),
            new Actor(FOLLOWER),
        ];
    } else if (actionName === ACTION.ANIM) {
        globalEvents.onTick.add(onTickHandler);
    }
});

const onTickHandler = (deltaTimeMsecs) => {
    _actors.forEach((actor) => actor.onTick(deltaTimeMsecs));

    if (Math.random() < 0.15) {
        // Sloppy, should really store these sensibly but for demo ok.
        const start = _actors[3]._obj.getPosition();
        const end = _actors[2]._obj.getPosition();
        const color = new Color(1, 0, 0, 1);
        const duration = 0;
        const thickness = 0.1;
        world.drawDebugLine(start, end, color, duration, thickness);
    }
};

refObject.onDestroyed.add((obj) => {
    globalEvents.onTick.remove(onTickHandler);
});
