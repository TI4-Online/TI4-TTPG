// Use line drawing for faction borders.
// 1. Get all plastic + control tokens
// 2. ???
// 3. Draw borders.
// Drawing circles on planets vs cutting up hexes is a lot simpler, start there.

const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../../lib/hex");
const { ObjectNamespace } = require("../object-namespace");
const PositionToPlanet = require("../system/position-to-planet");
const { UnitAttrsSet } = require("../unit/unit-attrs-set");
const { UnitPlastic } = require("../unit/unit-plastic");
const { GameObject, world } = require("../../wrapper/api");

const AREA = {
    PLANET: 1,
    SPACE: 2,
};

class Borders {
    /**
     * Find control tokens and units on system hexes.
     *
     * @returns {Array} list of control entries
     */
    static getAllControlEntries() {
        const hexToSystemObject = [];
        for (const systemObject of world.TI4.getAllSystemTileObjects()) {
            if (systemObject.getContainer()) {
                continue;
            }
            const pos = systemObject.getPosition();
            const hex = Hex.fromPosition(pos);
            hexToSystemObject[hex] = systemObject; // pick one if stacked
        }

        const controlEntries = [];
        const maybeAddControlEntry = (obj, hex, areaType) => {
            assert(obj instanceof GameObject);
            assert(typeof hex === "string");
            assert(typeof areaType === "number");

            const systemObj = hexToSystemObject[hex];
            if (!systemObj) {
                return;
            }
            let planet = undefined;
            if (areaType === AREA.PLANET) {
                const pos = obj.getPosition();
                planet = PositionToPlanet.getExactPlanet(pos, systemObj);
                if (!planet) {
                    return;
                }
            }

            const playerSlot = obj.getOwningPlayerSlot();
            if (playerSlot < 0) {
                return;
            }

            controlEntries.push({
                obj,
                hex,
                areaType,
                planet,
                playerSlot,
            });
        };

        const unitAttrsSet = new UnitAttrsSet();
        for (const unitPlastic of UnitPlastic.getAll()) {
            if (unitPlastic.owningPlayerSlot < 0) {
                continue;
            }
            const unitAttrs = unitAttrsSet.get(unitPlastic.unit);
            if (!unitAttrs) {
                throw new Error(`unknown unit "${unitPlastic.unit}"`);
            }
            if (unitAttrs.raw.structure || unitAttrs.raw.ground) {
                maybeAddControlEntry(
                    unitPlastic.gameObject,
                    unitPlastic.hex,
                    AREA.PLANET
                );
            } else if (unitAttrs.raw.ship) {
                maybeAddControlEntry(
                    unitPlastic.gameObject,
                    unitPlastic.hex,
                    AREA.SPACE
                );
            } else {
                throw new Error(
                    `unit "${unitPlastic.unit}" is neither planet nor space?`
                );
            }
        }

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!ObjectNamespace.isControlToken(obj)) {
                continue;
            }
            const pos = obj.getPosition();
            const hex = Hex.fromPosition(pos);
            maybeAddControlEntry(obj, hex, AREA.PLANET);
        }

        return controlEntries;
    }

    static getHexToControlSummary(controlEntries) {
        assert(Array.isArray(controlEntries));

        const hexToControlSummary = {};
        for (const controlEntry of controlEntries) {
            const hex = controlEntry.hex;
            assert(typeof hex === "string");
            const playerSlot = controlEntry.playerSlot;
            assert(playerSlot >= 0);

            let summary = hexToControlSummary[hex];
            if (!summary) {
                summary = {};
                hexToControlSummary[hex] = summary;
            }
            const area = controlEntry.planet
                ? controlEntry.planet.planetIndex
                : "space";
            const current = summary[area];
            if (current === undefined) {
                summary[area] = playerSlot;
            } else if (current !== playerSlot) {
                // Conflicting control for area.
                summary[area] = -1;
            }
        }

        return hexToControlSummary;
    }

    static getSpaceLineSegments(hexToControlSummary) {
        const segments = [];

        // Clockwise winding for inset
        for (const [hex, summary] of Object.entries(hexToControlSummary)) {
            const playerSlot = summary.space;
            if (playerSlot === undefined || playerSlot < 0) {
                continue;
            }
            const corners = Hex.corners(hex); // top right, then counterclockwise
            const neighbors = Hex.neighbors(hex); // top, then counterclockwise
            for (let i = 0; i < neighbors.length; i++) {
                const neighbor = neighbors[i];
                const neighborSummary = hexToControlSummary[neighbor];
                if (
                    neighborSummary &&
                    neighborSummary.space === summary.space
                ) {
                    continue;
                }
                const a = corners[i];
                const b = corners[(i + 1) % corners.length];
                segments.push({ line: [a, b], playerSlot });
            }
        }
        return segments;
    }

    static linkLineSegments(segments) {
        const result = [];

        for (const segment of segments) {
            const [a, b] = segment.line;
            let found = false;
            for (const candidate of result) {
                if (candidate.playerSlot != segment.playerSlot) {
                    continue;
                }
                const line = candidate.line;
                const last = line[line.length - 1];
                const d = last.subtract(a).magnitudeSquared();
                if (d > 0.1) {
                    continue;
                }
                found = true;
                line.push(b);
                break;
            }
            if (!found) {
                result.push(segment);
            }
        }
        return result;
    }

    constructor() {
        this._enabled = false;
        this._lines = undefined;
    }

    setEnabled(value) {
        assert(typeof value === "boolean");
        this._enabled = value;
        if (this._enabled) {
            this.update();
        } else if (this._lines) {
            // TODO XXX REMOVE LINES
            this._lines = undefined;
        }
    }
}

module.exports = { Borders, AREA };
