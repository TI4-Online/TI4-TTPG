const assert = require("../../../wrapper/assert-wrapper");
const lodash = require("lodash");
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

const RANKED_SYSTEMS = {
    high: [28, 29, 30, 32, 33, 35, 36, 38, 69, 70, 71, 75],
    med: [26, 27, 31, 34, 37, 64, 65, 66, 72, 73, 74, 76],
    low: [19, 20, 21, 22, 23, 24, 25, 59, 60, 61, 62, 63],
    red: [
        39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 67, 68, 77, 78, 79, 80,
    ],
};

const DEFAULT_CONFIG = {
    high: { min: 1, default: 1, avail: RANKED_SYSTEMS.high.length },
    med: { min: 1, default: 1, avail: RANKED_SYSTEMS.med.length },
    low: { min: 1, default: 1, avail: RANKED_SYSTEMS.low.length },
    red: { min: 2, default: 2, avail: RANKED_SYSTEMS.red.length },
    faction: { min: 1, default: 2, avail: -1 },
    minAlpha: { min: 0, default: 2, max: 3 },
    minBeta: { min: 0, default: 2, max: 3 },
    minLegendary: { min: 0, default: 1, max: 2 },
    useFactionsOnTable: false,
};

class BagDraft {
    static draftFactions(count, useFactionsOnTable) {
        assert(typeof count === "number");
        assert(typeof useFactionsOnTable === "boolean");
        let factions = new MiltyFactionGenerator()
            .setCount(
                count,
                true // override value bounds checking
            )
            .setFactionsFromCards(useFactionsOnTable)
            .generate();
        factions = Shuffle.shuffle(factions);
        assert(factions.length === count);
        return factions;
    }

    static getDefaultConfig() {
        const config = lodash.cloneDeep(DEFAULT_CONFIG);
        for (const entry of Object.values(config)) {
            if (typeof entry === "object") {
                assert(typeof entry.default === "number");
                entry._value = entry.default;
            }
        }
        return config;
    }

    /**
     * Create and shuffle a mutable copy of the available systems list.
     *
     * @returns {Object}
     */
    static getAvailableSystems() {
        const availableSystems = lodash.cloneDeep(RANKED_SYSTEMS);
        for (const [k, v] of Object.entries(availableSystems)) {
            availableSystems[k] = Shuffle.shuffle(v);
        }
        return availableSystems;
    }

    /**
     * Create a 'chosen systems' object, filling in systems to meet the
     * minimum requirements.
     *
     * @param {Object} config
     * @param {Object} availableSystems
     * @returns {Object}
     */
    static seedChoices(config, availableSystems) {
        assert(config);
        assert(availableSystems);
        assert(typeof config.minAlpha._value === "number");
        assert(typeof config.minBeta._value === "number");
        assert(typeof config.minLegendary._value === "number");
        assert(Array.isArray(availableSystems.low));
        assert(Array.isArray(availableSystems.med));
        assert(Array.isArray(availableSystems.high));
        assert(Array.isArray(availableSystems.red));

        const chosenSystems = {
            high: [],
            med: [],
            low: [],
            red: [],
        };

        let fixes; // apply config rules

        // Get to minalpha.
        fixes = Shuffle.shuffle([
            () => {
                chosenSystems.med.push(26);
                availableSystems.med = availableSystems.med.filter(
                    (x) => x != 26
                );
            },
            () => {
                chosenSystems.red.push(39);
                availableSystems.red = availableSystems.red.filter(
                    (x) => x != 39
                );
            },
            () => {
                chosenSystems.red.push(79);
                availableSystems.red = availableSystems.red.filter(
                    (x) => x != 79
                );
            },
        ]);
        for (let i = 0; i < config.minAlpha._value; i++) {
            const fix = fixes.shift();
            assert(fix);
            fix();
        }

        // Get to minbeta.
        fixes = Shuffle.shuffle([
            () => {
                chosenSystems.low.push(25);
                availableSystems.low = availableSystems.low.filter(
                    (x) => x != 25
                );
            },
            () => {
                chosenSystems.red.push(40);
                availableSystems.red = availableSystems.red.filter(
                    (x) => x != 40
                );
            },
            () => {
                chosenSystems.med.push(64);
                availableSystems.med = availableSystems.med.filter(
                    (x) => x != 64
                );
            },
        ]);
        for (let i = 0; i < config.minBeta._value; i++) {
            const fix = fixes.shift();
            assert(fix);
            fix();
        }

        // Get to minlegend.
        fixes = Shuffle.shuffle([
            () => {
                chosenSystems.med.push(65);
                availableSystems.med = availableSystems.med.filter(
                    (x) => x != 65
                );
            },
            () => {
                chosenSystems.med.push(66);
                availableSystems.med = availableSystems.med.filter(
                    (x) => x != 66
                );
            },
        ]);
        for (let i = 0; i < config.minLegendary._value; i++) {
            const fix = fixes.shift();
            assert(fix);
            fix();
        }

        return chosenSystems;
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
        this._bags = undefined;
        this._config = BagDraft.getDefaultConfig();
    }

    getConfig() {
        return this._config;
    }

    start() {
        assert(!this._bags); // call cancel to remove old bags
        this._bags = BagDraft.createEmptyBags();

        // Get the available systems and factions.
        const availableSystems = BagDraft.getAvailableSystems();
        const chosenSystems = BagDraft.seedChoices(
            this._config,
            availableSystems
        );
        while (
            chosenSystems.high.length <
            this._config.high._value * this._bags.length
        ) {
            const tile = availableSystems.high.pop();
            chosenSystems.high.push(tile);
        }
        while (
            chosenSystems.med.length <
            this._config.med._value * this._bags.length
        ) {
            const tile = availableSystems.med.pop();
            chosenSystems.med.push(tile);
        }
        while (
            chosenSystems.low.length <
            this._config.low._value * this._bags.length
        ) {
            const tile = availableSystems.low.pop();
            chosenSystems.low.push(tile);
        }
        while (
            chosenSystems.red.length <
            this._config.red._value * this._bags.length
        ) {
            const tile = availableSystems.red.pop();
            chosenSystems.red.push(tile);
        }
        for (const [k, v] of Object.entries(chosenSystems)) {
            chosenSystems[k] = Shuffle.shuffle(v);
        }
        console.log(
            `BagDraft: chosenSystems |high|=${chosenSystems.high.length} |med|=${chosenSystems.med.length} |low|=${chosenSystems.low.length} |red|=${chosenSystems.red.length}`
        );

        const factions = BagDraft.draftFactions(
            this._bags.length * this._config.faction._value,
            this._config.useFactionsOnTable
        );

        for (const bag of this._bags) {
            const above = bag.getPosition().add([0, 0, 10]);
            const rot = new Rotator(0, 0, 0);
            const addSystemToBag = (tile) => {
                assert(typeof tile === "number");
                const system = world.TI4.getSystemByTileNumber(tile);
                assert(system);
                const nsid = system.tileNsid;
                // Always spawn a new one, leave the ones in the tiles box alone.
                const systemTileObj = Spawn.spawn(nsid, above, rot);
                assert(systemTileObj);
                bag.addObjects([systemTileObj]);
            };
            for (let i = 0; i < this._config.high._value; i++) {
                const tile = chosenSystems.high.pop();
                addSystemToBag(tile);
            }
            for (let i = 0; i < this._config.med._value; i++) {
                const tile = chosenSystems.med.pop();
                addSystemToBag(tile);
            }
            for (let i = 0; i < this._config.low._value; i++) {
                const tile = chosenSystems.low.pop();
                addSystemToBag(tile);
            }
            for (let i = 0; i < this._config.red._value; i++) {
                const tile = chosenSystems.red.pop();
                addSystemToBag(tile);
            }
        }

        for (const bag of this._bags) {
            for (let i = 0; i < this._config.faction._value; i++) {
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
        this._config = BagDraft.getDefaultConfig();
    }
}

module.exports = { BagDraft };
