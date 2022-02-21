const { refObject, world, GameObject } = require("../../wrapper/api");
const assert = require("../../wrapper/assert-wrapper");

class DimensionalTear {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._systemTile = 0;

        this._obj.onReleased.add(() => this.place());
        this._obj.onGrab.add(() => this.remove());
        this._obj.onCreated.add(() => this.place());

        if (world.getExecutionReason() === "ScriptReload") {
            this.place();
        }
    }

    place() {
        const systemObject = world.TI4.getSystemTileObjectByPosition(
            this._obj.getPosition()
        );

        if (!systemObject) {
            return;
        }

        this.remove();

        const system = world.TI4.getSystemBySystemTileObject(systemObject);

        if (!system.anomalies) {
            system.anomalies = [];
        }
        system.anomalies.push("gravity_rift");

        this._systemTile = system.tile;
    }

    remove() {
        if (!this._systemTile) {
            return; // not placed yer
        }

        const system = world.TI4.getSystemByTileNumber(this._systemTile);
        const index = system.anomalies.indexOf("gravity_rift");
        system.anomalies.splice(index, 1);

        this._systemTile = 0;
    }
}

new DimensionalTear(refObject);
