const assert = require("../../wrapper/assert-wrapper");
const { Facing } = require("../facing");
const { Hex } = require("../../lib/hex");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { UnitPlastic } = require("../unit/unit-plastic");
const {
    getClosestPlanet,
    //getExactPlanet,
} = require("../../lib/system/position-to-planet");
const { GameObject, world } = require("../../wrapper/api");

// Encode units in hexes
// Upper case signals color.  No-color entries always first.
const COLOR_CODE = {
    white: "W",
    blue: "B",
    purple: "P",
    yellow: "Y",
    red: "R",
    green: "G",
    orange: "E", // 'O' vs '0' bad
    pink: "K",
};

const TYPE = {
    UNIT: 1,
    TOKEN: 2,
    SPACE: 3,
    PLANET: 4,
};

const UNIT_CODE = {
    carrier: "c",
    cruiser: "r",
    destroyer: "y",
    dreadnought: "d",
    fighter: "f",
    flagship: "h",
    infantry: "i",
    pds: "p",
    space_dock: "s",
    war_sun: "w",
    mech: "m",
};

const TOKEN_CODE = {
    "token.command:*/*": "t",
    "token.control:*/*": "o",
};

const ATTACHMENT_NSID_TO_TYPE_AND_CODE = {
    // SPACE
    "token.wormhole.creuss:base/alpha": { type: TYPE.SPACE, code: "a" },
    "token.wormhole.creuss:base/beta": { type: TYPE.SPACE, code: "b" },
    "token:pok/frontier": { type: TYPE.SPACE, code: "e" },
    "token.wormhole.creuss:pok/gamma": { type: TYPE.SPACE, code: "g" },
    "token.wormhole.exploration:pok/gamma": { type: TYPE.SPACE, code: "g" },
    "token.exploration:pok/ion_storm": {
        type: TYPE.SPACE,
        code: "n",
        flippable: true,
    },
    "token.nekro:pok/dimensional_tear": { type: TYPE.SPACE, code: "h" },
    "token.vuilraith:pok/dimensional_tear": { type: TYPE.SPACE, code: "h" },

    // PLANET STATIC
    "token.attachment.exploration:pok/dmz": { type: TYPE.PLANET, code: "z" },
    "token.attachment.exploration:pok/dyson_sphere": {
        type: TYPE.PLANET,
        code: "d",
    },
    "token.attachment.exploration:pok/lazax_survivors": {
        type: TYPE.PLANET,
        code: "x",
    },
    "token.attachment.exploration:pok/mining_world": {
        type: TYPE.PLANET,
        code: "m",
    },
    "token.exploration:pok/mirage": { type: TYPE.PLANET, code: "k" },
    "token.attachment.exploration:pok/nano_forge": {
        type: TYPE.PLANET,
        code: "f",
    },
    "token.attachment.exploration:pok/paradise_world": {
        type: TYPE.PLANET,
        code: "p",
    },
    "token.attachment.exploration:pok/rich_world": {
        type: TYPE.PLANET,
        code: "r",
    },
    "token.exploration:pok/stellar_converter": { type: TYPE.PLANET, code: "l" },
    "token.attachment.ul:pok/terraform": { type: TYPE.PLANET, code: "t" },
    "token.ul:pok/sleeper": { type: TYPE.PLANET, code: "q" },
    "token.attachment.ul:pok/geoform": { type: TYPE.PLANET, code: "u" },
    "token.attachment.exploration:pok/tomb_of_emphidia": {
        type: TYPE.PLANET,
        code: "j",
    },

    // PLANET FLIPPABLE (face down is tech skip side, toggle case for flipped)
    "token.attachment.exploration:pok/biotic_facility": {
        type: TYPE.PLANET,
        code: "i",
        flippable: true,
    },
    "token.attachment.exploration:pok/cybernetic_facility": {
        type: TYPE.PLANET,
        code: "c",
        flippable: true,
    },
    "token.attachment.exploration:pok/propulsion_facility": {
        type: TYPE.PLANET,
        code: "o",
        flippable: true,
    },
    "token.attachment.exploration:pok/warfare_facility": {
        type: TYPE.PLANET,
        code: "w",
        flippable: true,
    },
    "token.keleres:codex.vigil/custodia_vigilia": {
        type: TYPE.PLANET,
        code: "v",
        flippable: true,
    },
};

// Top: system1,system2,...
// System: <tile><X><Y>space;planet1;planet2;...
// Region: <color[A-Z]><count[0-9]*><unit[a-z]>*<attachments>
// Within a system color is sticky (seed empty for tokens)
// Within a region count is sticky (seed 1), reset to 1 for attachments
const DELIMITER = {
    SYSTEM: ",",
    PLANET: ";",
    ATTACHMENTS: "*",
};

const GROUND_UNIT_SET = new Set(["infantry", "mech", "pds", "space_dock"]);

class HexItems {
    constructor(systemTileObj) {
        assert(ObjectNamespace.isSystemTile(systemTileObj));
        this._systemTileObj = systemTileObj;
        this._system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        this._entries = [];
    }

    addCommandToken(obj, colorCode) {
        assert(obj instanceof GameObject);
        assert(typeof colorCode === "string");
        assert(colorCode.length > 0);

        const code = TOKEN_CODE["token.command:*/*"];

        // Abort if already there.
        for (const entry of this._entries) {
            if (entry.code === code && entry.colorCode === colorCode) {
                return;
            }
        }

        this._entries.push({ code, colorCode, planetIndex: -1, token: true });
    }

    addControlToken(obj, colorCode) {
        assert(obj instanceof GameObject);
        assert(typeof colorCode === "string");
        assert(colorCode.length > 0);

        const code = TOKEN_CODE["token.control:*/*"];

        const pos = obj.getPosition();
        const planet = getClosestPlanet(pos, this._systemTileObj);
        if (!planet) {
            return;
        }
        const planetIndex = planet.planetIndex;

        // Abort if already there.
        for (const entry of this._entries) {
            if (
                entry.code === code &&
                entry.colorCode === colorCode &&
                entry.planetIndex === planetIndex
            ) {
                return;
            }
        }

        this._entries.push({ code, colorCode, planetIndex, token: true });
    }

    addUnit(unitPlastic, colorCode) {
        assert(unitPlastic instanceof UnitPlastic);
        assert(typeof colorCode === "string");
        assert(colorCode.length > 0);

        const unit = unitPlastic.unit;
        const code = UNIT_CODE[unit];

        let planetIndex = -1; // space
        if (GROUND_UNIT_SET.has(unit)) {
            const pos = unitPlastic.gameObject.getPosition();
            const planet = getClosestPlanet(pos, this._systemTileObj);
            if (planet) {
                planetIndex = planet.planetIndex;
            }
        }

        // Add to count if already there.
        for (const entry of this._entries) {
            if (
                entry.code === code &&
                entry.colorCode === colorCode &&
                entry.planetIndex === planetIndex
            ) {
                entry.count += unitPlastic.count;
                return;
            }
        }

        // Add a new entry.
        this._entries.push({
            code,
            colorCode,
            planetIndex,
            count: unitPlastic.count,
        });
    }

    addAttachment(obj) {
        assert(obj instanceof GameObject);

        const nsid = ObjectNamespace.getNsid(obj);

        const typeAndCode = ATTACHMENT_NSID_TO_TYPE_AND_CODE[nsid];
        if (!typeAndCode) {
            return;
        }

        let code = typeAndCode.code;
        if (typeAndCode.flippable && Facing.isFaceDown(obj)) {
            code = code.toUpperCase();
        }

        let planetIndex = -1; // space
        if (typeAndCode.type === TYPE.PLANET) {
            const pos = obj.getPosition();
            const planet = getClosestPlanet(pos, this._systemTileObj);
            if (!planet) {
                return;
            }
            planetIndex = planet.planetIndex;
        }

        this._entries.push({ code, planetIndex, attachment: true });
    }

    sortEntries() {
        const cmp = (entryA, entryB) => {
            let a, b;

            // Sort by region.
            a = entryA.planetIndex;
            b = entryB.planetIndex;
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }

            // Attachments always last.
            a = entryA.attachment ? 1 : 0;
            b = entryB.attachment ? 1 : 0;
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }

            // Sort by color.
            a = entryA.colorCode;
            b = entryB.colorCode;
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }

            // Move tokens to back of region-color list.
            // (Why?  This is the way the other encoder did things, keep it.)
            a = entryA.token ? 1 : 0;
            b = entryB.token ? 1 : 0;
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }

            // Sort by increasing count.
            a = entryA.count !== undefined ? entryA.count : 1;
            b = entryB.count !== undefined ? entryA.count : 1;
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }

            // Arbitrary but consistent final tie breaker.
            a = entryA.code;
            b = entryB.code;
            if (a < b) {
                return -1;
            }
            return 1;
        };

        this._entries.sort(cmp);
    }

    encode() {
        const result = [];

        const tile = ObjectNamespace.parseSystemTile(this._systemTileObj).tile;
        let rot = "";
        let ab = "";
        if (this._system.hyperlane) {
            ab = Facing.isFaceUp(this._systemTileObj) ? "A" : "B";
            rot = this._systemTileObj.getRotation().yaw + 30;
            rot = (rot + 360) % 360;
            rot = Math.floor(rot / 60);
        }
        result.push(`${tile}${ab}${rot}`);

        const pos = this._systemTileObj.getPosition();
        const scaleW = (Hex.HALF_SIZE * Math.sqrt(3)) / 2;
        const scaleH = Hex.HALF_SIZE * Math.sqrt(3);
        const y = Math.round(pos.x / scaleW);
        const x = Math.round(pos.y / scaleH);
        result.push(`${x >= 0 ? "+" : ""}${x}${y >= 0 ? "+" : ""}${y}`);

        this.sortEntries();

        let stickyPlanetIndex = -1;
        let stickyColor = "";
        let stickyCount = 1;
        let stickyAttachment = false;

        for (const entry of this._entries) {
            // Planet change?  (Keep color)
            const planetIndex =
                entry.planetIndex !== undefined ? entry.planetIndex : -1;
            if (planetIndex !== stickyPlanetIndex) {
                result.push(DELIMITER.PLANET);
                stickyPlanetIndex = planetIndex;
                stickyCount = 1;
                stickyAttachment = false;
            }

            // Attachment change?
            const attachment = entry.attachment ? true : false;
            if (attachment !== stickyAttachment) {
                // Should only ever toggle to true.
                assert(attachment);
                result.push(DELIMITER.ATTACHMENTS);
                stickyColor = "";
                stickyCount = 1;
                stickyAttachment = attachment;
            }

            // Color change?
            const color = entry.colorCode !== undefined ? entry.colorCode : "";
            if (color !== stickyColor) {
                result.push(color);
                stickyColor = color;
                stickyCount = 1;
            }

            // Count change?
            const count = entry.count !== undefined ? entry.count : 1;
            if (count !== stickyCount) {
                result.push(count);
                stickyCount = count;
            }

            assert(entry.code);
            result.push(entry.code);
        }

        return result.join("");
    }
}

module.exports = (data) => {
    // Create an entry for each system.
    const hexToHexItems = {};
    for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
        const pos = systemTileObj.getPosition();
        const hex = Hex.fromPosition(pos);
        hexToHexItems[hex] = new HexItems(systemTileObj);
    }

    const playerSlotToColorCode = {};
    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        const playerSlot = playerDesk.playerSlot;
        const colorName = playerDesk.colorName;
        const colorCode = COLOR_CODE[colorName];
        playerSlotToColorCode[playerSlot] = colorCode;
    }

    // Get units, associating cardboard with nearest plastic.
    const unitPlastics = UnitPlastic.getAll();
    UnitPlastic.assignTokens(unitPlastics);
    for (const unitPlastic of unitPlastics) {
        const hex = unitPlastic.hex;
        const hexItems = hexToHexItems[hex];
        if (!hexItems) {
            continue;
        }
        const colorCode = playerSlotToColorCode[unitPlastic.owningPlayerSlot];
        if (colorCode) {
            hexItems.addUnit(unitPlastic, colorCode);
        }
    }

    // Gather objects.
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }

        const pos = obj.getPosition();
        const hex = Hex.fromPosition(pos);
        const hexItems = hexToHexItems[hex];
        if (!hexItems) {
            continue;
        }

        // Always compute color, applies to *most* things.
        const playerSlot = obj.getOwningPlayerSlot();
        const colorCode = playerSlotToColorCode[playerSlot];

        if (ObjectNamespace.isCommandToken(obj)) {
            hexItems.addCommandToken(obj, colorCode);
        } else if (ObjectNamespace.isControlToken(obj)) {
            hexItems.addControlToken(obj, colorCode);
        }

        // Other (maybe need flippable)
        const nsid = ObjectNamespace.getNsid(obj);
        const typeAndCode = ATTACHMENT_NSID_TO_TYPE_AND_CODE[nsid];
        if (typeAndCode) {
            hexItems.addAttachment(obj);
        }
    }

    // At this point hexToHexItems have all goodies.
    const hexItems = Object.values(hexToHexItems);
    const encoded = hexItems.map((hexItem) => {
        return hexItem.encode();
    });
    data.hexSummary = encoded.join(DELIMITER.SYSTEM);
};
