const assert = require("../wrapper/assert-wrapper");
const { GameObject, world } = require("../wrapper/api");

/**
 * This will hopefully be a short-lived workaround for a TTPG bug.
 * When a script takes an object from a container, non-host players can't
 * see it.  Destroy and replace it, which they can see.
 */
class CloneReplace {
    constructor() {
        throw new Error("static only");
    }

    static cloneReplace(obj) {
        assert(obj instanceof GameObject);

        const pos = obj.getPosition();
        const json = obj.toJSONString();
        obj.destroy();
        const clone = world.createObjectFromJSON(json, pos);
        return clone;
    }
}

module.exports = { CloneReplace };
