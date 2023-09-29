const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
const { HomebrewLoaderUi } = require("./homebrew-loader-ui");
const { ObjectType, Vector, world } = require("../../wrapper/api");

const MAX_ID_LENGTH = 8;

const TI4_HOMEBREW_PACKAGE_ID_DEV = "56EC3F524ED72309122BB944A6E642AE";
const TI4_HOMEBREW_PACKAGE_ID_PRD = "56EC3F524ED72309122BB944A6E642AF";
const TI4_HOMEBREW_PACKAGE_IDS = [
    TI4_HOMEBREW_PACKAGE_ID_DEV,
    TI4_HOMEBREW_PACKAGE_ID_PRD,
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
        this._nameToEntry = [];
        this._idToOption = {};
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
        return Object.values(this._nameToEntry);
    }

    createAndAddUI() {
        new HomebrewLoaderUi(this).createAndAddUI();
    }

    /**
     * Start the loading process if not already loaded.
     *
     * If some players don't have the package installed, they will be asked
     * to subscribe to the package in the same way as when adding a package
     * through the object library. If all players already have the package
     * installed, it will be allowed immediately after calling this method.
     *
     * @returns {boolean} True if started
     */
    loadHomebrewPackage() {
        const requireAllowed = false;
        let packageId = this.getHomebrewPackageId(requireAllowed);
        if (!packageId) {
            packageId = TI4_HOMEBREW_PACKAGE_ID_PRD;
        }
        const packageRef = world.getPackageById(packageId);
        if (!packageRef) {
            console.log("HomebrewLoader.loadHomebrewPackage: unknown package");
            return false; // unknown, host must be subscribed
        }
        if (packageRef.isAllowed()) {
            console.log("HomebrewLoader.loadHomebrewPackage: already loaded");
            return true; // already loaded
        }

        // Load the package, it *may* be ready immediately.
        packageRef.allow();
        if (packageRef.isAllowed()) {
            console.log(
                "HomebrewLoader.loadHomebrewPackage: load succeeded immediately"
            );
            return true; // load finished without delay
        }

        // Some players need to install the package (they will see a prompt).
        console.log("HomebrewLoader.loadHomebrewPackage: waiting for install");
        return false;
    }

    getHomebrewPackageId(requireAllowed = true) {
        for (const packageId of TI4_HOMEBREW_PACKAGE_IDS) {
            const packageRef = world.getPackageById(packageId);
            if (!packageRef) {
                continue;
            }
            if (requireAllowed && !packageRef.isAllowed()) {
                continue;
            }
            return packageId;
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

        const isReady = this.loadHomebrewPackage();
        console.log(`HomebrewLoader.reset: isReady=${isReady}`);

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
            const option = this._idToOption[id];
            assert(option);
            this._runHomebrewScript(option);
        }
    }

    register(entry) {
        // NAME
        if (typeof entry.name !== "string") {
            Broadcast.chatAll(
                `HomebrewLoader.register: entry.name is not a string`,
                Broadcast.ERROR
            );
            return false;
        }
        if (entry.name.length === 0) {
            Broadcast.chatAll(
                `HomebrewLoader.register: entry.name is empty`,
                Broadcast.ERROR
            );
            return false;
        }
        if (this._nameToEntry[entry.name]) {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.name}] entry.name already registered`,
                Broadcast.ERROR
            );
            return false;
        }

        // DESCRIPTION
        if (typeof entry.description !== "string") {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.name}] entry.description is not a string`,
                Broadcast.ERROR
            );
            return false;
        }

        // PACKAGE
        if (typeof entry.packageId !== "string") {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.name}] entry.packageId is not a string`,
                Broadcast.ERROR
            );
            return false;
        }
        const packageRef = world.getPackageById(entry.packageId);
        if (!packageRef) {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.name}] missing packageId "${entry.packageId}"`,
                Broadcast.ERROR
            );
            return false;
        }

        // OPTIONS
        if (!Array.isArray(entry.options)) {
            Broadcast.chatAll(
                `HomebrewLoader.register: [${entry.name}] options is not an array`,
                Broadcast.ERROR
            );
            return false;
        }
        for (const option of entry.options) {
            // OPTION.ID
            if (typeof option !== "object") {
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}] option is not an object`,
                    Broadcast.ERROR
                );
                return false;
            }
            if (typeof option.id !== "string") {
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}] option.id is not a string`,
                    Broadcast.ERROR
                );
                return false;
            }
            if (option.id.length === 0) {
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}] option.id is empty`,
                    Broadcast.ERROR
                );
                return false;
            }
            if (option.id.length > MAX_ID_LENGTH) {
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}/${option.id}] option.id too long (max ${MAX_ID_LENGTH})`,
                    Broadcast.ERROR
                );
                return false;
            }
            if (this._idToOption[option.id]) {
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}/${option.id}] option.id already registered`,
                    Broadcast.ERROR
                );
                return false;
            }

            // OPTION.NAME
            if (typeof option.name !== "string") {
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}/${option.id}] option.name is not a string`,
                    Broadcast.ERROR
                );
                return false;
            }
            if (option.name.length === 0) {
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}/${option.id}] option.name is empty`,
                    Broadcast.ERROR
                );
                return false;
            }

            // OPTION.INJECT
            if (typeof option.inject !== "string") {
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}/${option.id}] option.inject is not a string`,
                    Broadcast.ERROR
                );
                return false;
            }
            if (!packageRef.getScriptFiles().includes(option.inject)) {
                console.log(
                    `available script fiels: ${JSON.stringify(
                        packageRef.getScriptFiles().sort()
                    )}`
                );
                Broadcast.chatAll(
                    `HomebrewLoader.register: [${entry.name}/${option.id}] missing injection script "${option.inject}"`,
                    Broadcast.ERROR
                );
                return false;
            }
        }

        // Everything looks good!
        this._nameToEntry[entry.name] = entry;
        for (const option of entry.options) {
            option.packageId = entry.packageId;
            this._idToOption[option.id] = option;
            console.log(
                `HomebrewLoader.register: "${entry.name}/${option.id}"`
            );

            // If this homebrew is already active (e.g. load saved game) inject now.
            const gameInProgress = world.TI4.config.timestamp > 0;
            const homebrewActive = this._active.has(option.id);
            if (gameInProgress && homebrewActive) {
                this._runHomebrewScript(option);
            }
        }
    }

    _runHomebrewScript(option) {
        assert(typeof option.inject === "string");
        assert(typeof option.packageId === "string");

        console.log(`HomebrewLoader._runHomebrewScript "${option.inject}"`);

        const packageRef = world.getPackageById(option.packageId);
        assert(packageRef);

        assert(packageRef.getScriptFiles().includes(option.inject));

        const templateId = "83FDE12C4E6D912B16B85E9A00422F43"; // cube
        const pos = new Vector(0, 0, -10);
        const obj = world.createObjectFromTemplate(templateId, pos);
        obj.setObjectType(ObjectType.NonInteractive);
        obj.setScript(option.inject, option.packageId);
        obj.setTags(["DELETED_ITEMS_IGNORE"]);
        process.nextTick(() => {
            obj.destroy();
        });
    }
}

module.exports = { HomebrewLoader };
