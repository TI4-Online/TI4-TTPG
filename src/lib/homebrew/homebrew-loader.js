const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
const { HomebrewLoaderUi } = require("./homebrew-loader-ui");
const { ObjectType, Vector, world } = require("../../wrapper/api");

const MAX_ID_LENGTH = 14;
const TI4_HOMEBREW_PACKAGE_IDS = [
    "56EC3F524ED72309122BB944A6E642AE", // dev
    "56EC3F524ED72309122BB944A6E642AF", // prd
];
const GLOBAL_STATE_KEY = "__homebrewLoader__";

let _homebrewLoader = undefined;

class HomebrewLoader {
    static getInstance() {
        if (!_homebrewLoader) {
            _homebrewLoader = new HomebrewLoader();
        }
        return _homebrewLoader;
    }

    constructor() {
        this._idToEntry = {};
        this._active = new Set();

        const json = world.getSavedData(GLOBAL_STATE_KEY);
        if (json && json.length > 0) {
            const array = JSON.parse(json);
            for (const id of array) {
                this._active.add(id);
            }
        }
    }

    getEntries() {
        return Object.values(this._idToEntry);
    }

    createAndAddUI() {
        new HomebrewLoaderUi(this).createAndAddUI();
    }

    getHomebrewPackageId() {
        for (const packageId of TI4_HOMEBREW_PACKAGE_IDS) {
            const packageRef = world.getPackageById(packageId);
            if (packageRef && packageRef.isAllowed()) {
                return packageId;
            }
        }
    }

    getActive(id) {
        assert(typeof id === "string");
        return this._active.has(id);
    }

    setActive(id, value) {
        assert(typeof id === "string");
        assert(typeof value === "boolean");

        console.log(`HomebrewLoader.setActive: "${id}" <- ${value}`);

        if (value) {
            this._active.add(id);
        } else {
            this._active.delete(id);
        }

        const json = JSON.stringify(Array.from(this._active));
        world.setSavedData(json, GLOBAL_STATE_KEY);
    }

    reset() {
        this._idToEntry = {};

        const homebrewPackageId = this.getHomebrewPackageId();
        if (!homebrewPackageId) {
            Broadcast.broadcastAll(
                locale("homebrew.package_missing"),
                Broadcast.ERROR
            );
            return false;
        }
        console.log(`HomebrewLoader.reset: package id "${homebrewPackageId}"`);

        this._runHomebrewScript({
            inject: "REGISTRY.js",
            packageId: homebrewPackageId,
        });
        return true;
    }

    injectActive() {
        for (const id of this._active) {
            const entry = this._idToEntry[id];
            assert(entry);
            this._runHomebrewScript(entry);
        }
    }

    register(entry) {
        // ID
        if (typeof entry !== "object") {
            Broadcast.chatAll(
                "HomebrewLoader.register: entry is not an object",
                Broadcast.ERROR
            );
            return false;
        }
        if (typeof entry.id !== "string") {
            Broadcast.chatAll(
                "HomebrewLoader.register: entry.id is not a string",
                Broadcast.ERROR
            );
            return false;
        }
        if (entry.id.length > MAX_ID_LENGTH) {
            Broadcast.chatAll(
                `HomebrewLoader.register: entry.id "${entry.id}" too long (max ${MAX_ID_LENGTH})`,
                Broadcast.ERROR
            );
            return false;
        }
        if (this._idToEntry[entry.id]) {
            Broadcast.chatAll(
                `HomebrewLoader.register: entry.id "${entry.id}" already registered`,
                Broadcast.ERROR
            );
            return false;
        }

        // NAME
        if (typeof entry.name !== "string") {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.id}] entry.name is not a string`,
                Broadcast.ERROR
            );
            return false;
        }

        // DESCRIPTION
        if (typeof entry.description !== "string") {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.id}] entry.description is not a string`,
                Broadcast.ERROR
            );
            return false;
        }

        // PACKAGE
        if (typeof entry.packageId !== "string") {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.id}] entry.packageId is not a string`,
                Broadcast.ERROR
            );
            return false;
        }
        const packageRef = world.getPackageById(entry.packageId);
        if (!packageRef) {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.id}] missing packageId "${entry.packageId}"`,
                Broadcast.ERROR
            );
            return false;
        }

        // INJECT
        if (typeof entry.inject !== "string") {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.id}] entry.inject is not a string`,
                Broadcast.ERROR
            );
            return false;
        }
        if (!packageRef.getScriptFiles().includes(entry.inject)) {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.id}] missing injection script "${entry.inject}"`,
                Broadcast.ERROR
            );
            return false;
        }

        console.log(`HomebrewLoader.register: "${entry.id}"`);
        this._idToEntry[entry.id] = entry;

        // If this homebrew is already active (e.g. load saved game) inject now.
        const gameInProgress = world.TI4.config.timestamp > 0;
        const homebrewActive = this._active.has(entry.id);
        if (gameInProgress && homebrewActive) {
            this._runHomebrewScript(entry);
        }
    }

    _runHomebrewScript(entry) {
        assert(typeof entry.inject === "string");
        assert(typeof entry.packageId === "string");

        console.log(`HomebrewLoader._runHomebrewScript "${entry.inject}"`);

        const packageRef = world.getPackageById(entry.packageId);
        assert(packageRef);

        assert(packageRef.getScriptFiles().includes(entry.inject));

        const templateId = "83FDE12C4E6D912B16B85E9A00422F43"; // cube
        const pos = new Vector(0, 0, -10);
        const obj = world.createObjectFromTemplate(templateId, pos);
        obj.setObjectType(ObjectType.NonInteractive);
        obj.setScript(entry.inject, entry.packageId);
        obj.setTags(["DELETED_ITEMS_IGNORE"]);
        process.nextTick(() => {
            obj.destroy();
        });
    }
}

module.exports = { HomebrewLoader };
