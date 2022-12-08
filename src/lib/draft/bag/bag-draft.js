const assert = require("../../../wrapper/assert-wrapper");
const { FactionToken } = require("../../faction/faction-token");
const { MiltyFactionGenerator } = require("../milty/milty-faction-generator");
const { Shuffle } = require("../../shuffle");
const { Spawn } = require("../../../setup/spawn/spawn");
const {
    GameObject,
    Rotator,
    Vector,
    globalEvents,
    world,
} = require("../../../wrapper/api");

class BagDraft {
    static draftFactions(count) {
        let factions = new MiltyFactionGenerator()
            .setCount(
                count,
                true // override value bounds checking
            )
            .generate();
        factions = Shuffle.shuffle(factions);
        assert(factions.length === count);
        return factions;
    }

    static draftSystems(count, isRed) {
        assert(typeof count === "number");
        assert(typeof isRed === "boolean");

        const excludeTiles = new Set([
            81, // muaat supernova
            82, // mallice
        ]);

        let systems = world.TI4.getAllSystems();
        systems = systems.filter(
            (system) =>
                (isRed ? system.red : system.blue) &&
                !excludeTiles.has(system.tile)
        );
        systems = Shuffle.shuffle(systems);
        if (count > 0) {
            assert(systems.length >= count);
            systems = systems.slice(0, count);
            assert(systems.length === count);
        }
        return systems;
    }
    /**
     * Create per-player bags.
     *
     * @returns {Array.{Container}}
     */
    static createEmptyBags() {
        return world.TI4.getAllPlayerDesks().map((playerDesk) => {
            const nsid = "bag:base/generic";
            const pos = playerDesk.localPositionToWorld(new Vector(50, 0, 0));
            const rot = playerDesk.rot;
            const bag = Spawn.spawn(nsid, pos, rot);
            assert(bag);
            bag.setTags(["DELETED_ITEMS_IGNORE"]);

            // If "show card fronts" and "show names" become scriptable
            // set those here.

            // Do not set owning player slot, only that player can inspect.
            bag.setPrimaryColor(playerDesk.plasticColor);
            return bag;
        });
    }

    static cloneAndReturnObject(obj, pos, rot) {
        assert(obj instanceof GameObject);

        const json = obj.toJSONString();
        const container = undefined;
        const rejectedObjs = [obj];
        const player = undefined;
        globalEvents.TI4.onContainerRejected.trigger(
            container,
            rejectedObjs,
            player
        );

        const clone = world.createObjectFromJSON(json, pos);
        clone.setRotation(rot);
        return clone;
    }

    constructor() {
        this._blueCount = 3;
        this._redCount = 2;
        this._factionCount = 2;

        this._bags = undefined;
    }

    setBlueCount(value) {
        assert(typeof value === "number");
        assert(value > 0);
        this._blueCount = value;
        return this;
    }

    setRedCount(value) {
        assert(typeof value === "number");
        assert(value > 0);
        this._redCount = value;
        return this;
    }

    setFactionCount(value) {
        assert(typeof value === "number");
        assert(value > 0);
        this._factionCount = value;
        return this;
    }

    start() {
        assert(!this._bags); // call cancel to remove old bags
        this._bags = BagDraft.createEmptyBags();

        // Get the available systems and factions.
        const reds = BagDraft.draftSystems(
            this._bags.length * this._redCount,
            true
        );
        const blues = BagDraft.draftSystems(
            this._bags.length * this._blueCount,
            false
        );
        const factions = BagDraft.draftFactions(
            this._bags.length * this._factionCount
        );
        console.log(
            `BagDraft.start: |reds|=${reds.length} |blues|=${blues.length} |factions|=${factions.length}`
        );

        for (const bag of this._bags) {
            const above = bag.getPosition().add([0, 0, 10]);
            const rot = new Rotator(0, 0, 0);
            const addSystemToBag = (system) => {
                const nsid = system.tileNsid;
                // Always spawn a new one, leave the ones in the tiles box alone.
                const systemTileObj = Spawn.spawn(nsid, above, rot);
                assert(systemTileObj);
                bag.addObjects([systemTileObj]);
            };
            for (let i = 0; i < this._redCount; i++) {
                const system = reds.pop();
                assert(system);
                addSystemToBag(system);
            }
            for (let i = 0; i < this._blueCount; i++) {
                const system = blues.pop();
                assert(system);
                addSystemToBag(system);
            }
        }

        for (const bag of this._bags) {
            for (let i = 0; i < this._factionCount; i++) {
                const faction = factions.pop();
                assert(faction);
                let factionReference = FactionToken.findOrSpawnFactionReference(
                    faction.nsidName
                );
                assert(factionReference);

                // Add a copy to the draft bag, return the original.
                const above = bag.getPosition().add([0, 0, 10]);
                const rot = new Rotator(0, 0, 180);
                factionReference = BagDraft.cloneAndReturnObject(
                    factionReference,
                    above,
                    rot
                );
                assert(factionReference);

                bag.addObjects([factionReference]);
            }
        }

        return this;
    }

    cancel() {
        for (const bag of this._bags) {
            bag.setTags(["DELETED_ITEMS_IGNORE"]);
            bag.destroy();
        }
        this._bags = undefined;
    }
}

module.exports = { BagDraft };
