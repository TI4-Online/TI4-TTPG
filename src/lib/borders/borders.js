// Use line drawing for faction borders.
// 1. Get all plastic + control tokens
// 2. ???
// 3. Draw borders.
// Drawing circles on planets vs cutting up hexes is a lot simpler, start there.

const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../../lib/hex");
const { ObjectNamespace } = require("../object-namespace");
const { Polygon } = require("../polygon");
const PositionToPlanet = require("../system/position-to-planet");
const { UnitAttrsSet } = require("../unit/unit-attrs-set");
const { UnitPlastic } = require("../unit/unit-plastic");
const {
    Color,
    DrawingLine,
    GameObject,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");

const PLANET_POINTS = 16;
const DEFAULT_THICKNESS = 0.2;

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
                systemObj,
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
                summary = {
                    systemObj: controlEntry.systemObj,
                };
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

    static getPlanetLineSegments(systemObj, planet, playerSlot) {
        assert(systemObj instanceof GameObject);
        assert(typeof playerSlot === "number");
        assert(playerSlot >= 0);

        const pos = PositionToPlanet.getWorldPosition(
            systemObj,
            planet.position
        );
        const r = planet.radius * Hex.SCALE - 0.2;

        // Build the fully assembled line, no need to link.
        // As such, add these AFTER linking space line segments.
        const points = [];
        for (let i = 0; i < PLANET_POINTS; i++) {
            const phi = (Math.PI * 2 * i) / (PLANET_POINTS - 1);
            points.push(
                new Vector(
                    pos.x + Math.cos(phi) * r,
                    pos.y + Math.sin(phi) * r,
                    0
                )
            );
        }
        return {
            line: points,
            playerSlot,
        };
    }

    static linkLineSegments(segments) {
        assert(Array.isArray(segments));
        assert(segments.length > 0);

        const result = [];

        let watchdog = 0;

        let grow;
        let found = false;
        while (segments.length > 0) {
            watchdog += 1;
            if (watchdog > 100000) {
                throw new Error("stuck?");
            }
            // If the last loop failed, start a new segment.
            if (!found) {
                grow = segments.shift();
                result.push(grow);
            }
            found = false;

            const growHead = grow.line[0];
            const growTail = grow.line[grow.line.length - 1];

            // Keep growing.
            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                if (grow.playerSlot !== segment.playerSlot) {
                    continue;
                }
                assert(segment.line.length === 2);
                const [a, b] = segment.line;

                let d = growHead.subtract(b).magnitudeSquared();
                if (d < 0.1) {
                    // Prepend
                    grow.line.unshift(a);
                    found = true;
                    segments.splice(i, 1);
                    break;
                }

                d = growHead.subtract(a).magnitudeSquared();
                if (d < 0.1) {
                    // Prepend
                    grow.line.unshift(b);
                    found = true;
                    segments.splice(i, 1);
                    break;
                }

                d = growTail.subtract(a).magnitudeSquared();
                if (d < 0.1) {
                    // Append
                    grow.line.push(b);
                    found = true;
                    segments.splice(i, 1);
                    break;
                }

                d = growTail.subtract(b).magnitudeSquared();
                if (d < 0.1) {
                    // Append
                    grow.line.push(a);
                    found = true;
                    segments.splice(i, 1);
                    break;
                }
            }
        }

        return result;
    }

    static createDrawingLine(segment, thickness) {
        assert(segment.line.length >= 2);
        assert(typeof thickness === "number");

        let color = undefined;
        for (const desk of world.TI4.getAllPlayerDesks()) {
            if (desk.playerSlot === segment.playerSlot) {
                color = desk.color;
                break;
            }
        }
        if (!color) {
            color = new Color(0.5, 0.5, 0.5, 1);
        }

        // Polygon does not want closed.
        const head = segment.line[0];
        const tail = segment.line[segment.line.length - 1];
        const closed = head.subtract(tail).magnitudeSquared() < 0.1;
        if (closed) {
            segment.line.pop();
        }

        // Inset a little extra so outside edges do no touch.
        const inset = thickness / 2 + DEFAULT_THICKNESS / 2;
        const points = new Polygon(segment.line).inset(inset).getPoints();

        const z = world.getTableHeight() + 0.01 * Hex.SCALE;
        points.forEach((p) => {
            p.z = z;
        });

        // Apply the closing segment.
        if (closed) {
            const head = points[0];
            points.push(head.clone());
        }

        // Extend one futher to avoid "pac-man" artifact where lines meet.
        if (points.length > 1) {
            const second = points[1];
            points.push(second.clone());
        }

        const drawingLine = new DrawingLine();
        drawingLine.color = color;
        drawingLine.points = points; // set AFTER applying closed, not mutable
        drawingLine.rounded = false;
        drawingLine.thickness = thickness;

        return drawingLine;
    }

    static isSameDrawingLine(a, b) {
        assert(a instanceof DrawingLine);
        assert(b instanceof DrawingLine);

        if (a.points.length !== b.points.length) {
            return false;
        }
        if (a.rounded !== b.rounded) {
            return false;
        }

        const dt = Math.abs(a.thickness - b.thickness);
        if (dt > 0.01) {
            return false;
        }

        const dr = Math.abs(a.color.r - b.color.r);
        const dg = Math.abs(a.color.g - b.color.g);
        const db = Math.abs(a.color.b - b.color.b);
        const da = Math.abs(a.color.a - b.color.a);
        if (dr + dg + db + da > 0.01) {
            return false;
        }

        for (let i = 0; i < a.points.length; i++) {
            const ap = a.points[i];
            const bp = b.points[i];
            if (ap.subtract(bp).magnitudeSquared() > 0.1) {
                return false;
            }
        }

        return true;
    }

    constructor() {
        this._enabled = false;
        this._lines = undefined;
        this._thickness = DEFAULT_THICKNESS;

        this._doUpdate = () => {
            this.drawLinesAsync();
        };
    }

    setEnabled(value) {
        assert(typeof value === "boolean");
        this._enabled = value;
        if (this._enabled) {
            this.drawLinesAsync();
            globalEvents.TI4.onTurnChanged.add(this._doUpdate);
        } else {
            this.clearLines();
            globalEvents.TI4.onTurnChanged.remove(this._doUpdate);
        }
    }

    _getDrawLinesTasks() {
        let controlEntries;
        let hexToControlSummary;
        let lineSegments;
        let linkedSegments;

        return [
            () => {
                controlEntries = Borders.getAllControlEntries();
            },
            () => {
                hexToControlSummary =
                    Borders.getHexToControlSummary(controlEntries);
            },
            () => {
                lineSegments =
                    Borders.getSpaceLineSegments(hexToControlSummary);
            },
            () => {
                linkedSegments = Borders.linkLineSegments(lineSegments);
            },
            () => {
                for (const summary of Object.values(hexToControlSummary)) {
                    const systemObj = summary.systemObj;
                    const system =
                        world.TI4.getSystemBySystemTileObject(systemObj);
                    for (let i = 0; i < system.planets.length; i++) {
                        const planet = system.planets[i];
                        const playerSlot = summary[i];
                        if (playerSlot && playerSlot >= 0) {
                            linkedSegments.push(
                                Borders.getPlanetLineSegments(
                                    systemObj,
                                    planet,
                                    playerSlot
                                )
                            );
                        }
                    }
                }
            },
            () => {
                this.clearLines();
            },
            () => {
                if (!this._enabled) {
                    return;
                }
                this.clearLines(); // just in case added between frames
                this._lines = [];
                for (const linkedSegment of linkedSegments) {
                    const line = Borders.createDrawingLine(
                        linkedSegment,
                        this._thickness
                    );
                    world.addDrawingLine(line);
                    this._lines.push(line);
                }
            },
        ];
    }

    drawLines() {
        for (const task of this._getDrawLinesTasks()) {
            task();
        }
    }

    drawLinesAsync() {
        for (const task of this._getDrawLinesTasks()) {
            world.TI4.asyncTaskQueue.add(task);
        }
    }

    clearLines() {
        if (!this._lines) {
            return;
        }
        for (const candidate of this._lines) {
            const allDrawingLines = world.getDrawingLines();
            for (let i = 0; i < allDrawingLines.length; i++) {
                const drawingLine = allDrawingLines[i];
                if (Borders.isSameDrawingLine(drawingLine, candidate)) {
                    world.removeDrawingLine(i);
                    break;
                }
            }
        }
        this._lines = undefined;
    }
}

module.exports = { Borders, AREA };
