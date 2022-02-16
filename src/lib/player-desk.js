const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("./object-namespace");
const { PlayerDeskUI } = require("./player-desk-ui");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("./global-saved-data");
const {
    Color,
    Player,
    Rotator,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");
const { ColorUtil } = require("./color/color-util");

/**
 * Color values corresponding to TTPG player slots.
 */
const PLAYER_SLOT_COLORS = [
    { r: 0, g: 0.427, b: 0.858 },
    { r: 0.141, g: 1, b: 0.141 },
    { r: 0.572, g: 0, b: 0 },
    { r: 0, g: 0.286, b: 0.286 },
    { r: 0.286, g: 0, b: 0.572 },
    { r: 1, g: 0.427, b: 0.713 },
    { r: 0.858, g: 0.427, b: 0 },
    { r: 0.572, g: 0.286, b: 0 },
    { r: 0.713, g: 0.858, b: 1 },
    { r: 1, g: 1, b: 0.427 },
    { r: 0, g: 0.572, b: 0.572 },
    { r: 1, g: 0.713, b: 0.466 },
    { r: 0.713, g: 0.427, b: 1 },
    { r: 0.427, g: 0.713, b: 1 },
    { r: 0, g: 1, b: 1 },
    { r: 0, g: 0, b: 1 },
    { r: 1, g: 0, b: 0 },
    { r: 0.215, g: 0.215, b: 0.215 },
    { r: 1, g: 1, b: 1 },
    { r: 0, g: 0, b: 0 },
];

/**
 * Desk positions in cm and rotation in degrees.  Z ignored.
 * First is "right", the counterclockwise about the table.
 */
const PLAYER_DESKS = [
    {
        colorName: "pink",
        hexColor: "#F46FCD",
        pos: { x: 6.0544, y: 149.218, z: 3 },
        yaw: 180.0,
        defaultPlayerSlot: 5,
        minPlayerCount: 7,
    },
    {
        colorName: "green",
        hexColor: "#007306",
        pos: { x: 96.9075, y: 99.7789, z: 3 },
        yaw: 117.5,
        defaultPlayerSlot: 1,
        minPlayerCount: 2,
    },
    {
        colorName: "red",
        hexColor: "#CB0000",
        pos: { x: 119.842, y: -6.0544, z: 3 },
        yaw: 90.0,
        defaultPlayerSlot: 16,
        minPlayerCount: 6,
    },
    {
        colorName: "yellow",
        hexColor: "#D6B700",
        pos: { x: 91.3162, y: -110.52, z: 3 },
        yaw: 62.5,
        defaultPlayerSlot: 9,
        minPlayerCount: 4,
    },
    {
        colorName: "orange",
        hexColor: "#F3631C",
        pos: { x: -6.05441, y: -150.691, z: 3 },
        yaw: 0,
        defaultPlayerSlot: 6,
        minPlayerCount: 8,
    },
    {
        colorName: "purple",
        hexColor: "#7400B7",
        pos: { x: -96.29, y: -99.7789, z: 3 },
        yaw: -62.5,
        defaultPlayerSlot: 4,
        minPlayerCount: 3,
    },
    {
        colorName: "blue",
        hexColor: "#07B2FF",
        pos: { x: -119.224, y: 6.05442, z: 3 },
        yaw: -90.0,
        defaultPlayerSlot: 15,
        minPlayerCount: 5,
    },
    {
        colorName: "white",
        hexColor: "#8B8B8B",
        pos: { x: -90.6987, y: 110.52, z: 3 },
        yaw: -117.5,
        defaultPlayerSlot: 18,
        minPlayerCount: 1,
    },
];

const SEAT_CAMERA = {
    pos: { x: -90, y: -6, z: 100 },
};

const DEFAULT_PLAYER_COUNT = 6;
let _playerCount = false;
let _playerDesks = false;

// ----------------------------------------------------------------------------

/**
 * Move newly joined players to a non-seat player slot.
 * This should be called from a globalEvents.onPlayerJoined handler.
 *
 * @param {Player} player
 */
function moveNewPlayerToNonSeatSlot(player) {
    assert(player instanceof Player);

    const reservedSlots = new Set();
    for (const playerDesk of PlayerDesk.getAllPlayerDesks()) {
        reservedSlots.add(playerDesk.playerSlot);
    }
    for (const otherPlayer of world.getAllPlayers()) {
        if (otherPlayer == player) {
            continue;
        }
        reservedSlots.add(otherPlayer.getSlot());
    }
    if (!reservedSlots.has(player.getSlot())) {
        return; // player is in a safe slot
    }
    for (let i = 0; i < 20; i++) {
        if (!reservedSlots.has(i)) {
            player.switchSlot(i);
            return;
        }
    }
    throw new Error("unable to find open slot");
}

// ----------------------------------------------------------------------------

// Bounce joining players to unseated.
globalEvents.onPlayerJoined.add((player) => {
    moveNewPlayerToNonSeatSlot(player);
});

// Release seat when someone leaves.
globalEvents.onPlayerLeft.add((player) => {
    PlayerDesk.resetUIs();
});

globalEvents.onPlayerSwitchedSlots.add((player, oldPlayerSlot) => {
    PlayerDesk.resetUIs();
});

// Unseat host when first loading game.
const isRescriptReload = world.getExecutionReason() === "ScriptReload";
const runOnce = () => {
    globalEvents.onTick.remove(runOnce);

    // If not reloading scripts move the host to a non-seat slot.
    if (!isRescriptReload) {
        for (const player of world.getAllPlayers()) {
            moveNewPlayerToNonSeatSlot(player);
        }
    }

    // Reset "take a seat" UI.
    PlayerDesk.resetUIs();
};
globalEvents.onTick.add(runOnce);

// ----------------------------------------------------------------------------

/**
 * The player desk represents a player's private area.
 */
class PlayerDesk {
    /**
     * Current player count (available seats, not currently joined players).
     *
     * @returns {number}
     */
    static getPlayerCount() {
        if (!_playerCount) {
            _playerCount = GlobalSavedData.get(
                GLOBAL_SAVED_DATA_KEY.PLAYER_COUNT,
                DEFAULT_PLAYER_COUNT
            );
        }
        return _playerCount;
    }

    /**
     * Reset number of usable seats at the table.
     * (Desk spaces may remain, but fewer are used.)
     *
     * @param {number} value
     */
    static setPlayerCount(value) {
        assert(typeof value === "number");
        assert(1 <= value && value <= 8);

        // Keep locally, as well as persist across save/load.
        _playerCount = value;
        GlobalSavedData.set(GLOBAL_SAVED_DATA_KEY.PLAYER_COUNT, _playerCount);

        // Clear precomputed availabled desks, recompute on next get.
        _playerDesks = false;

        // Reset "claim seat" buttons.
        PlayerDesk.resetUIs();
    }

    /**
     * Get all player desks, accounting for current player count.
     * Player desks are read-only and shared, DO NOT MUTATE!
     *
     * @returns {Array.{PlayerDesk}}
     */
    static getAllPlayerDesks() {
        if (_playerDesks) {
            return _playerDesks;
        }
        _playerDesks = [];
        for (let i = 0; i < PLAYER_DESKS.length; i++) {
            const attrs = PLAYER_DESKS[i];
            if (attrs.minPlayerCount > PlayerDesk.getPlayerCount()) {
                continue;
            }
            _playerDesks.push(new PlayerDesk(attrs));
        }
        return _playerDesks;
    }

    /**
     * Get player desk by owning player slot.
     *
     * @param {number} playerSlot
     * @returns {PlayerDesk|undefined}
     */
    static getByPlayerSlot(playerSlot) {
        for (const playerDesk of PlayerDesk.getAllPlayerDesks()) {
            if (playerDesk.playerSlot === playerSlot) {
                return playerDesk;
            }
        }
    }

    /**
     * Get player desk closest to this position.
     *
     * @param {Vector} position
     * @returns {PlayerDesk}
     */
    static getClosest(position) {
        assert(typeof position.x === "number"); // "instanceof Vector" broken

        let closestDistanceSq = Number.MAX_VALUE;
        let closest = false;

        // This might be called a lot, find without creating new objects.
        for (const playerDesk of PlayerDesk.getAllPlayerDesks()) {
            const dx = position.x - playerDesk._center.x;
            const dy = position.y - playerDesk._center.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < closestDistanceSq) {
                closestDistanceSq = dSq;
                closest = playerDesk;
            }
        }
        if (!closest) {
            throw new Error(`unable to find closest for ${position}`);
        }
        return closest;
    }

    static resetUIs() {
        for (const playerDesk of PlayerDesk.getAllPlayerDesks()) {
            playerDesk.resetUI();
        }
    }

    resetUI() {
        if (this._ui) {
            world.removeUIElement(this._ui);
            this._ui = false;
        }
        this._ui = new PlayerDeskUI(this).create();
        world.addUI(this._ui);
    }

    constructor(attrs) {
        this._colorName = attrs.colorName;
        this._color = ColorUtil.colorFromHex(attrs.hexColor);
        this._pos = new Vector(
            attrs.pos.x,
            attrs.pos.y,
            world.getTableHeight()
        );
        this._rot = new Rotator(0, (attrs.yaw + 360 + 90) % 360, 0);
        this._playerSlot = attrs.defaultPlayerSlot;
        this._ui = false;

        // Pos is a bit to the right of the visual center of the main desk
        // area.  Compute that visual center as well for "nearest" checks.
        this._center = this.localPositionToWorld(new Vector(0, -6, 0));
        this._center.z = this._pos.z;
    }

    get color() {
        return this._color;
    }
    get colorName() {
        return this._colorName;
    }
    get pos() {
        return this._pos;
    }
    get center() {
        return this._center;
    }
    get rot() {
        return this._rot;
    }
    get playerSlot() {
        return this._playerSlot;
    }

    /**
     * Translate a local-to-desk position to world space.
     * "Bottom" desk center [-119.224, 6.05442] for manual calculation.
     *
     * @param {Vector} pos - can be a {x,y,z} object
     * @returns {Vector}
     */
    localPositionToWorld(pos) {
        assert(typeof pos.x === "number"); // instanceof Vector broken
        return new Vector(pos.x, pos.y, pos.z)
            .rotateAngleAxis(this.rot.yaw, [0, 0, 1])
            .add(this.pos);
    }

    /**
     * Traslate a local-to-desk rotation to world space.
     *
     * @param {Rotator} rot - can be a {yaw, pitch, roll} object
     * @returns {Rotator}
     */
    localRotationToWorld(rot) {
        assert(typeof rot.yaw === "number"); // instanceof Rotator broken
        return new Rotator(rot.pitch, rot.yaw, rot.roll).compose(this.rot);
    }

    /**
     * Move a player to this seat.
     *
     * @param {Player} player
     */
    seatPlayer(player) {
        assert(player instanceof Player);
        player.switchSlot(this.playerSlot);

        // Careful, need to look at a position on the top surface of
        // the table or else the camera can bug out and fall below table.
        const pos = this.localPositionToWorld(SEAT_CAMERA.pos);
        const rot = pos.findLookAtRotation([0, 0, world.getTableHeight()]);
        player.setPositionAndRotation(pos, rot);

        this.resetUI();
    }

    /**
     * Get changeColor options.
     *
     * @returns {Array.{colorName:string,color:Color}}
     */
    getColorOptions() {
        const result = [];
        for (let i = 0; i < PLAYER_DESKS.length; i++) {
            const attrs = PLAYER_DESKS[i];
            result.push({
                colorName: attrs.colorName,
                color: ColorUtil.colorFromHex(attrs.hexColor),
            });
        }
        return result;
    }

    /**
     * Change seat color.
     *
     * Note this does not attempt to recolor other objects, caller should
     * clean up any per-color components and restore in the new color after.
     *
     * @param {string} colorName - for promissory notes ("Ceasefile (Blue)")
     * @param {Color} colorTint
     */
    changeColor(colorName, colorTint) {
        assert(typeof colorName === "string");
        assert(colorTint instanceof Color);

        let legalColorName = false;
        for (const deskAttrs of PLAYER_DESKS) {
            if (deskAttrs.colorName === colorName) {
                legalColorName = true;
                break;
            }
        }
        assert(legalColorName);

        const srcColorName = this.colorName;
        const srcColorTint = this.color;
        const srcPlayerSlot = this.playerSlot;
        const dstColorName = colorName;
        const dstColorTint = colorTint;
        let dstPlayerSlot = -1;

        // This another desk is already using this color name, swap the two.
        let swapWith = false;
        for (const otherDesk of PlayerDesk.getAllPlayerDesks()) {
            if (otherDesk.colorName === colorName && otherDesk !== this) {
                swapWith = otherDesk;
                break;
            }
        }
        if (swapWith) {
            dstPlayerSlot = swapWith.playerSlot;
        } else {
            // Not swapping with an active seat.  Lookup from unused seats.
            for (const deskAttrs of PLAYER_DESKS) {
                if (deskAttrs.colorName === colorName) {
                    dstPlayerSlot = deskAttrs.defaultPlayerSlot;
                    break;
                }
            }
        }

        // Do not change color of an active seat!
        if (this.isSetup() || (swapWith && swapWith.isSetup())) {
            return false;
        }

        // At this point all src/dst values are known.  Remove any players from
        // slots and swap things around.
        assert(dstPlayerSlot >= 0);
        const srcPlayer = world.getPlayerBySlot(srcPlayerSlot);
        const dstPlayer = world.getPlayerBySlot(dstPlayerSlot);
        if (srcPlayer) {
            moveNewPlayerToNonSeatSlot(srcPlayer);
        }
        if (dstPlayer) {
            moveNewPlayerToNonSeatSlot(dstPlayer);
        }

        if (swapWith) {
            swapWith._colorName = srcColorName;
            swapWith._color = srcColorTint;
            swapWith._playerSlot = srcPlayerSlot;
        }

        this._colorName = dstColorName;
        this._color = dstColorTint;
        this._playerSlot = dstPlayerSlot;

        if (srcPlayer) {
            srcPlayer.switchSlot(dstPlayerSlot);
        }
        if (dstPlayer) {
            dstPlayer.switchSlot(srcPlayerSlot);
        }

        this.resetUI();
        swapWith.resetUI();

        return true;
    }

    /**
     * Has this desk been setup?  That is, per-desk items unpacked.
     *
     * @returns {boolean}
     */
    isSetup() {
        const playerSlot = this.playerSlot;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue; // require sheet be linked to slot
            }
            if (ObjectNamespace.isCommandSheet(obj)) {
                return true;
            }
        }
    }

    /**
     * Visualize the player area center / rotation.
     */
    drawDebug() {
        const colorLine = new Color(0, 1, 0);
        const colorPoint = new Color(1, 0, 0);
        const duration = 10;
        const thicknessLine = 1;
        const sizePoint = thicknessLine * 3;

        const dir = this.center.add(
            this.rot.getForwardVector().multiply(sizePoint * 5)
        );

        world.drawDebugPoint(this.center, sizePoint, colorPoint, duration);
        world.drawDebugLine(
            this.center,
            dir,
            colorLine,
            duration,
            thicknessLine
        );
    }
}

module.exports = { PlayerDesk, DEFAULT_PLAYER_COUNT, PLAYER_SLOT_COLORS };
