const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Hex } = require("../../lib/hex");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { world } = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");

const NSID_TO_TEMPLATE = {};
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-bag-token.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-bag-unit.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-card.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-card-holder.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-mat.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-other.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-sheet.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-tile-strategy.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-tile-system.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-token.json"));
Object.assign(NSID_TO_TEMPLATE, require("./template/nsid-unit.json"));

// Enable to check for any objects spawning inside other objects.
// Can lead to physics getting "upset".
const LOG_SPAWN_COLLISIONS = false;

// The "NSID" in NSID_TO_TEMPLATE is normally a reasonable group name, the
// prefix for releated objects.  In some cases we want to group earlier,
// such as merging technology.color into an overall technology deck.
const OVERRIDE_GROUP_NSIDS = ["card.technology"];

let _typeSet = false;

/**
 * Spawn game objects from the hard-coded template json files.
 * This is intended to dump raw objects on an empty table as the first
 * step of (manual) setup.
 */
class Spawn {
    static getAllNSIDs() {
        return Object.keys(NSID_TO_TEMPLATE);
    }

    /**
     * Get the "group" for an object, mostly for cards -> deck.
     *
     * @param {*} nsid
     * @returns {string}
     */
    static getGroupName(nsid) {
        // Use OVERRIDE_GROUP_NSIDS when matches.
        for (const groupName of OVERRIDE_GROUP_NSIDS) {
            if (nsid.startsWith(groupName)) {
                return groupName;
            }
        }

        if (!_typeSet) {
            _typeSet = new Set();
            for (const nsid of Object.keys(NSID_TO_TEMPLATE)) {
                const parsed = ObjectNamespace.parseNsid(nsid);
                _typeSet.add(parsed.type);
            }
        }

        // Failing that, use the most-specific of the template types.
        // This groups
        let groupName = false;
        for (const candidateType of _typeSet.keys()) {
            if (nsid.startsWith(candidateType)) {
                if (!groupName || groupName.length < candidateType.length) {
                    groupName = candidateType;
                }
            }
        }
        assert(groupName);
        return groupName;
    }

    /**
     * Group nsids by `getGroupName` value.
     * This is useful for merging decks split across multiple templates due
     * to card sheet size limitations.
     *
     * @param {Array.{string}} nsids
     * @returns {Object.{string: Array.{string}}}
     */
    static groupNSIDs(nsids) {
        assert(Array.isArray(nsids));

        const result = {};
        for (const nsid of nsids) {
            const groupName = Spawn.getGroupName(nsid);
            if (!result[groupName]) {
                result[groupName] = [];
            }
            result[groupName].push(nsid);
        }
        return result;
    }

    /**
     * Suggest a (localized) name for an object.
     * Note that card names should not be set this way, they get reset to
     * the template `cardNames` value.
     *
     * @param {string} nsid
     * @returns {string} localized name
     */
    static suggestName(nsid) {
        const parsedNsid = ObjectNamespace.parseNsid(nsid);
        const groupName = Spawn.getGroupName(nsid);
        if (groupName.startsWith("card.")) {
            return locale(groupName.replace(/^card/, "deck"));
        }

        // A lot of names are NSID "type.name".
        let candidate = `${parsedNsid.type}.${parsedNsid.name}`;
        let candidateResult = locale(candidate);
        if (candidateResult !== candidate) {
            return candidateResult;
        }

        if (parsedNsid.type === "bag.unit") {
            const unitName = locale(`unit.${parsedNsid.name}`);
            return locale("bag.unit", { unit: unitName });
        }

        if (parsedNsid.type === "bag.token") {
            const tokenName = locale(`token.${parsedNsid.name}`);
            return locale("bag.token", { token: tokenName });
        }

        if (parsedNsid.type === "tile.system") {
            return locale("tile.system", { tile: parsedNsid.name });
        }

        if (parsedNsid.type.startsWith("token.attachment")) {
            let candidate = `token.attachment.${parsedNsid.name}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }

        if (parsedNsid.type.startsWith("token.exploration")) {
            let candidate = `token.exploration.${parsedNsid.name}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }

        if (parsedNsid.type.startsWith("token.wormhole")) {
            let candidate = `token.wormhole.${parsedNsid.name}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }

        if (parsedNsid.type === "token.command") {
            const faction = world.TI4.getFactionByNsidName(parsedNsid.name);
            if (faction) {
                return locale("token.command", { faction: faction.nameAbbr });
            }
        }
        if (parsedNsid.type === "token.control") {
            const faction = world.TI4.getFactionByNsidName(parsedNsid.name);
            if (faction) {
                return locale("token.control", { faction: faction.nameAbbr });
            }
        }

        // Try "token.{name}"?
        if (parsedNsid.type.startsWith("token")) {
            let candidate = `token.${parsedNsid.name}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }

        // Try "{type}" for "{type}:{source}/*".
        if (parsedNsid.name === "*") {
            let candidate = `${parsedNsid.type}`;
            let candidateResult = locale(candidate);
            if (candidateResult !== candidate) {
                return candidateResult;
            }
        }

        if (nsid === "token.keleres:codex.vigil/custodia_vigilia") {
            return locale("token.attachment.custodia_vigilia");
        }

        // Try with only first part of name (errata strategy cards).
        const name0 = parsedNsid.name.split(".")[0];
        candidate = `${parsedNsid.type}.${name0}`;
        candidateResult = locale(candidate);
        if (candidateResult !== candidate) {
            return candidateResult;
        }
    }

    /**
     * Spawn a known-nsid object and assign (locale aware) name.
     *
     * @param {string} nsid
     * @param {Vector} position
     * @param {Rotator} rotation
     * @returns {GameObject}
     */
    static spawn(nsid, position, rotation) {
        assert(typeof nsid === "string");
        assert(typeof position.x === "number"); // "instanceof Vector" broken
        assert(typeof rotation.yaw === "number"); // "instanceof Rotator" broken

        const templateId = NSID_TO_TEMPLATE[nsid];
        if (!templateId) {
            throw new Error(`unknown nsid "${nsid}"`);
        }

        const obj = world.createObjectFromTemplate(templateId, position);
        if (!obj) {
            const msg = `Spawn failed for "${nsid}" (template id "${templateId}"), this happens if you have more than one version of the TI4 mod.`;
            Broadcast.chatAll(msg, Broadcast.ERROR);
            throw new Error(msg);
        }

        obj.setRotation(rotation);

        const name = Spawn.suggestName(nsid);
        if (name) {
            obj.setName(name);
        }

        // If this is a system tile, scale it to match Hex size.
        if (ObjectNamespace.isSystemTile(obj)) {
            const scale = Hex.SCALE * 0.995;
            obj.setScale([scale, scale, scale]);
        }

        // Optionally watch for collisions, useful to make sure initial spawns
        // aren't happening at overlapping positions.
        if (LOG_SPAWN_COLLISIONS) {
            const onHitHandler = (
                thisObject,
                otherObject,
                first,
                impactPoint,
                impulse
            ) => {
                const a = ObjectNamespace.getNsid(thisObject);
                const b = otherObject
                    ? ObjectNamespace.getNsid(otherObject)
                    : otherObject;
                console.log(`HIT "${a}" - "${b}"`);
            };
            // Remove a few frames later.
            let lifetime = 3;
            const onTickHandler = () => {
                lifetime--;
                if (lifetime <= 0) {
                    obj.onHit.remove(onHitHandler);
                    obj.onTick.remove(onTickHandler);
                }
            };
            obj.onHit.add(onHitHandler);
            obj.onTick.add(onTickHandler);
        }

        return obj;
    }

    static spawnGenericContainer(position, rotation) {
        const chestTemplateId = "C134C94B496A8D48C79534A5BDBC8A3D";
        const bag = world.createObjectFromTemplate(chestTemplateId, position);
        bag.setRotation(rotation);
        bag.setMaxItems(500);
        return bag;
    }

    /**
     * Register a template ID for spawn.  Template IDs need to be unique across packages,
     * additive loading the homebrew package is sufficient, no need to specify package id.
     *
     * @param {string} nsid
     * @param {string} templateId
     */
    static injectNsidToTemplate(nsid, templateId) {
        assert(typeof nsid === "string");
        assert(typeof templateId === "string");
        const old = NSID_TO_TEMPLATE[nsid];
        if (old && templateId !== old) {
            throw new Error(
                `Spawn.injectNsidToTemplate: nsid "${nsid}" already registered with different template`
            );
        }
        NSID_TO_TEMPLATE[nsid] = templateId;
    }
}

module.exports = { Spawn };
