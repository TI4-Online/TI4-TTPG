const assert = require("../../../wrapper/assert-wrapper");
const { CardUtil } = require("../../card/card-util");
const { ObjectNamespace } = require("../../object-namespace");
const { world } = require("../../../wrapper/api");
const { Shuffle } = require("../../shuffle");

class AbstractFactionGenerator {
    constructor() {
        this._count = this.getDefaultCount();
        this._seedWithOnTableCards = true;
    }

    setSeedWithOnTableCards(value) {
        assert(typeof value === "boolean");
        this._seedWithOnTableCards = value;
        return this;
    }

    /**
     * What is the minimum number to offer? (draft setup slider min)
     * Must be at least world.TI4.config.playerCount.
     *
     * @returns {number}
     */
    getMinCount() {
        return world.TI4.config.playerCount;
    }

    /**
     * What is the maximum number to offer? (draft setup slider max)
     * Outer layer might impose a cap to conserve UI size.
     *
     * @returns {number}
     */
    getMaxCount() {
        return world.TI4.config.playerCount + 3;
    }

    /**
     * Where should the slicer be set initially?
     * @returns {number}
     */
    getDefaultCount() {
        return world.TI4.config.playerCount + 2;
    }

    getCount() {
        return this._count;
    }

    setCount(value) {
        assert(typeof value === "number");
        assert(value >= this.getMinCount());
        assert(value <= this.getMaxCount());
        this._count = value;
        return this;
    }

    /**
     * Generate the factions.  Use a sensible default, subclasses may override this.
     *
     * @param {number} count
     * @returns {Array.{string}} - array of faction nsidNames (e.g. ["arborec", "sol"])
     */
    generateFactions(count) {
        return AbstractFactionGenerator._standardGenerate(
            count,
            this._seedWithOnTableCards
        );
    }

    static _getOnTableFactionCards() {
        const result = [];

        const checkDiscardPile = true;
        const allowFaceDown = false;
        for (const obj of world.getAllObjects()) {
            if (!CardUtil.isLooseCard(obj, checkDiscardPile, allowFaceDown)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (
                !nsid.startsWith("card.faction_token") &&
                !nsid.startsWith("card.faction_reference")
            ) {
                continue;
            }
            result.push(obj);
        }
        return result;
    }

    static _getOnTableFactionCardNsidNames() {
        const result = [];

        const cards = AbstractFactionGenerator._getOnTableFactionCards();
        for (const obj of cards) {
            const nsid = ObjectNamespace.getNsid(obj);
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (!parsed) {
                continue;
            }
            const nsidName = parsed.name.split(".")[0];
            result.push(nsidName);
        }

        // Return unique results.
        return result.filter((v, i, a) => a.indexOf(v) === i);
    }

    /**
     * Normal fair faction selection, avoids mixing Keleres with matching faction.
     *
     * @param {number} count
     * @param {seedWithOnTableCards} boolean
     * @returns {Array.{string}} faction nsidName array
     */
    static _standardGenerate(count, seedWithOnTableCards) {
        // Get available factions, accounts for using pok, codex 3, etc.
        let nsidNames = [];
        world.TI4.getAllFactions().forEach((faction) => {
            const nsidName = faction.nsidName;
            nsidNames.push(nsidName);
        });

        let keleresFlavors = [
            "keleres_argent",
            "keleres_mentak",
            "keleres_xxcha",
        ];

        // Remove the specific Keleres flavors.  If present, inject a generic
        // one for selection purposes.  (Might not be present if not using Codex 3.)
        let haveKeleres = false;
        nsidNames = nsidNames.filter((nsidName) => {
            const isKeleres = keleresFlavors.includes(nsidName);
            haveKeleres = haveKeleres || isKeleres;
            return !isKeleres;
        });
        if (haveKeleres) {
            nsidNames.push("keleres");
        }

        nsidNames = Shuffle.shuffle(nsidNames);

        // If seeding with cards add those to the front.
        // Note that mixing Keleres with a competing flavor will still
        // strip one out.
        if (seedWithOnTableCards) {
            const tableNsidNames =
                AbstractFactionGenerator._getOnTableFactionCardNsidNames();
            Shuffle.shuffle(tableNsidNames);
            const otherNsidNames = nsidNames.filter(
                (name) => !tableNsidNames.includes(name)
            );
            nsidNames = [];
            nsidNames.push(...tableNsidNames);
            nsidNames.push(...otherNsidNames);
        }

        // Do not mix Keleres with conflicting faction
        const rejectSet = new Set();
        let chosenKeleres = undefined;
        nsidNames = nsidNames
            .filter((nsidName) => {
                if (rejectSet.has(nsidName)) {
                    return false;
                }

                // When encountering a Keleres flavor remove it from the set.
                if (nsidName === "argent") {
                    keleresFlavors = keleresFlavors.filter((nsidName) => {
                        return nsidName !== "keleres_argent";
                    });
                } else if (nsidName === "mentak") {
                    keleresFlavors = keleresFlavors.filter((nsidName) => {
                        return nsidName !== "keleres_mentak";
                    });
                } else if (nsidName === "xxcha") {
                    keleresFlavors = keleresFlavors.filter((nsidName) => {
                        return nsidName !== "keleres_xxcha";
                    });
                }

                // On Keleres choose an available flavor.
                if (nsidName === "keleres") {
                    assert(!chosenKeleres);
                    if (keleresFlavors.length === 0) {
                        return false; // all base factions already picked
                    }
                    chosenKeleres = Shuffle.shuffle(keleresFlavors)[0];
                    assert(chosenKeleres);
                    if (chosenKeleres === "keleres_argent") {
                        rejectSet.add("argent");
                    } else if (chosenKeleres === "keleres_mentak") {
                        rejectSet.add("mentak");
                    } else if (chosenKeleres === "keleres_xxcha") {
                        rejectSet.add("xxcha");
                    }
                }
                return true;
            })
            .map((nsidName) => {
                return nsidName === "keleres" ? chosenKeleres : nsidName;
            });

        assert(nsidNames.length >= count);
        nsidNames = nsidNames.slice(0, count);
        return nsidNames;
    }
}

module.exports = { AbstractFactionGenerator };
