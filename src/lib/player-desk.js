const assert = require("../wrapper/assert-wrapper");
const locale = require("./locale");
const { ColorUtil } = require("./color/color-util");
const { ObjectNamespace } = require("./object-namespace");
const { PlayerDeskSetup } = require("./player-desk-setup");
const { PlayerDeskUI } = require("./player-desk-ui");
const {
    Color,
    Player,
    Rotator,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("./global-saved-data");

/**
 * Desk positions in cm and rotation in degrees.  Z ignored.
 * First is "right", the counterclockwise about the table.
 */
const PLAYER_DESKS = [
    // East
    {
        colorName: "pink",
        hexColor: "#FF84D6",
        plasticHexColor: "#F46FCD",
        pos: { x: 0, y: 160 },
        yaw: 180.0,
        defaultPlayerSlot: 5,
        playerCounts: [7, 8],
    },
    // North (right to left)
    {
        colorName: "green",
        hexColor: "#5AE35A",
        plasticHexColor: "#00A306",
        pos: { x: 102.4, y: 100.8 },
        yaw: 120,
        defaultPlayerSlot: 1,
        playerCounts: [3, 4, 5, 6, 7, 8],
    },
    {
        colorName: "red",
        hexColor: "#FF2417",
        plasticHexColor: "#CB0000",
        pos: { x: 129.4, y: 0 },
        yaw: 90.0,
        defaultPlayerSlot: 16,
        playerCounts: [2, 5, 6, 7, 8],
    },
    {
        colorName: "yellow",
        hexColor: "#FFDA00",
        plasticHexColor: "#FFDA00",
        pos: { x: 102.4, y: -100.8 },
        yaw: 60,
        defaultPlayerSlot: 9,
        playerCounts: [3, 4, 5, 6, 7, 8],
    },
    // West
    {
        colorName: "orange",
        hexColor: "#FF932B",
        plasticHexColor: "#FF7603",
        pos: { x: 0, y: -160 },
        yaw: 0,
        defaultPlayerSlot: 6,
        playerCounts: [8],
    },
    // South (left to right)
    {
        colorName: "purple",
        hexColor: "#C800FF",
        plasticHexColor: "#5E219C",
        pos: { x: -102.4, y: -100.8 },
        yaw: -60,
        defaultPlayerSlot: 4,
        playerCounts: [4, 5, 6, 7, 8],
    },
    {
        colorName: "blue",
        hexColor: "#07B2FF",
        plasticHexColor: "#07B2FF",
        pos: { x: -129.4, y: 0 },
        yaw: -90.0,
        defaultPlayerSlot: 15,
        playerCounts: [1, 2, 3, 6, 7, 8],
    },
    {
        colorName: "white",
        hexColor: "#BABABA",
        plasticHexColor: "#C1C1C1",
        pos: { x: -102.4, y: 100.8 },
        yaw: -120,
        defaultPlayerSlot: 18,
        playerCounts: [4, 5, 6, 7, 8],
    },
];

const SEAT_CAMERA = {
    pos: { x: -90, y: -6, z: 100 },
};

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

globalEvents.TI4.onGameSetup.add((state, player) => {
    PlayerDesk.resetUIs();
});

globalEvents.TI4.onPlayerCountChanged.add((newPlayerCount, player) => {
    // Clean any existing desks.
    if (_playerDesks) {
        for (const playerDesk of _playerDesks) {
            assert(playerDesk instanceof PlayerDesk);
            playerDesk.removeUI();
            if (!world.__isMock) {
                new PlayerDeskSetup(playerDesk).cleanGeneric();
            }
        }
        _playerDesks = false;
    }
    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        assert(playerDesk instanceof PlayerDesk);
        if (!world.__isMock) {
            new PlayerDeskSetup(playerDesk).setupGeneric();
        }
        playerDesk.addUI();
    }
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
     * Get all player desks, accounting for current player count.
     * Player desks are read-only and shared, DO NOT MUTATE!
     *
     * @returns {Array.{PlayerDesk}}
     */
    static getAllPlayerDesks() {
        if (_playerDesks) {
            return _playerDesks;
        }
        const playerCount = world.TI4.config.playerCount;
        _playerDesks = [];
        // Walk backwards so "south-east" is index 0 then clockwise.
        for (let i = PLAYER_DESKS.length - 1; i >= 0; i--) {
            const attrs = PLAYER_DESKS[i];
            if (!attrs.playerCounts.includes(playerCount)) {
                continue;
            }
            _playerDesks.push(new PlayerDesk(attrs, _playerDesks.length));
        }

        // Apply any saved desk state.
        const deskState = GlobalSavedData.get(
            GLOBAL_SAVED_DATA_KEY.DESK_STATE,
            []
        );
        if (deskState.length === _playerDesks.length) {
            for (let i = 0; i < _playerDesks.length; i++) {
                _playerDesks[i]._color = ColorUtil.colorFromHex(deskState[i].c);
                _playerDesks[i]._plasticColor = ColorUtil.colorFromHex(deskState[i].pc);
                _playerDesks[i]._colorName = deskState[i].cn;
                _playerDesks[i]._playerSlot = deskState[i].s;
                _playerDesks[i]._ready = deskState[i].r;
            }
        }

        return _playerDesks;
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

    constructor(attrs, index) {
        this._index = index;
        this._colorName = attrs.colorName;
        this._color = ColorUtil.colorFromHex(attrs.hexColor);
        this._plasticColor = ColorUtil.colorFromHex(attrs.plasticHexColor);
        this._pos = new Vector(
            attrs.pos.x,
            attrs.pos.y,
            world.getTableHeight()
        );
        this._rot = new Rotator(0, (attrs.yaw + 360 + 90) % 360, 0);
        this._playerSlot = attrs.defaultPlayerSlot;
        this._ui = false;

        // Pos is center, but allow for non-center pos.
        this._center = this._pos.clone();

        this._ready = false;
    }

    get center() {
        return this._center;
    }
    get color() {
        return this._color;
    }
    get plasticColor() {
        return this._plasticColor;
    }
    get colorName() {
        return this._colorName;
    }
    get index() {
        return this._index;
    }
    get playerSlot() {
        return this._playerSlot;
    }
    get pos() {
        return this._pos;
    }
    get rot() {
        return this._rot;
    }

    resetUI() {
        this.removeUI();
        this.addUI();
    }

    addUI() {
        // Do not apply UI once "ready".
        if (this._ready) {
            return;
        }
        const colorOptions = this.getColorOptions();
        const playerSlot = this.playerSlot;
        const config = {
            isReady: this.isDeskReady(),
            isOccupied: world.getPlayerBySlot(playerSlot),
            canFaction: world.TI4.config.timestamp > 0,
            hasFaction: world.TI4.getFactionByPlayerSlot(playerSlot),
        };
        this._ui = new PlayerDeskUI(this, colorOptions, {
            onTakeSeat: (button, player) => {
                this.seatPlayer(player);
                this.resetUI();
            },
            onLeaveSeat: (button, player) => {
                moveNewPlayerToNonSeatSlot(player);
                this.resetUI();
            },
            onChangeColor: (button, player) => {
                const colorName = button._colorName;
                const colorTint = button._colorTint;
                const plasticColorTint = button._plasticColorTint;
                assert(colorName);
                assert(colorTint);
                assert(plasticColorTint);
                if (!this.changeColor(colorName, colorTint, plasticColorTint)) {
                    player.showMessage(locale("ui.desk.color_not_available"));
                }
                this.resetUI();
            },
            onSetupFaction: (button, player) => {
                new PlayerDeskSetup(this).setupFaction();
                this.resetUI();
            },
            onCleanFaction: (button, player) => {
                new PlayerDeskSetup(this).cleanFaction();
                this.resetUI();
            },
            onReady: (button, player) => {
                this.setReady(true);
                this.resetUI();
            },
        }).create(config);
        world.addUI(this._ui);
    }

    removeUI() {
        if (this._ui) {
            world.removeUIElement(this._ui);
            this._ui = false;
        }
    }

    /**
     * Translate a local-to-desk position to world space.
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
    }

    /**
     * Get changeColor options.
     *
     * @returns {Array.{colorName:string,color:Color,plasticColor:Color}}
     */
    getColorOptions() {
        const result = [];
        for (let i = 0; i < PLAYER_DESKS.length; i++) {
            const attrs = PLAYER_DESKS[i];
            result.push({
                colorName: attrs.colorName,
                colorTint: ColorUtil.colorFromHex(attrs.hexColor),
                plasticColorTint: ColorUtil.colorFromHex(attrs.plasticHexColor),
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
    changeColor(colorName, colorTint, plasticColorTint) {
        assert(typeof colorName === "string");
        assert(colorTint instanceof Color);
        assert(plasticColorTint instanceof Color);

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
        const srcPlasticColorTint = this.plasticColor;
        const srcPlayerSlot = this.playerSlot;
        const srcSetup = this.isDeskSetup();
        const srcFaction = world.TI4.getFactionByPlayerSlot(srcPlayerSlot);
        const dstColorName = colorName;
        const dstColorTint = colorTint;
        const dstPlasticColorTint = plasticColorTint;
        let dstPlayerSlot = -1;
        let dstSetup = false;
        let dstFaction = false;

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
            dstSetup = swapWith.isDeskSetup();
            dstFaction = world.TI4.getFactionByPlayerSlot(dstPlayerSlot);
        } else {
            // Not swapping with an active seat.  Lookup from unused seats.
            for (const deskAttrs of PLAYER_DESKS) {
                if (deskAttrs.colorName === colorName) {
                    dstPlayerSlot = deskAttrs.defaultPlayerSlot;
                    break;
                }
            }
        }

        // Reject change request if swap-with is seated.
        if (dstPlayerSlot >= 0 && world.getPlayerBySlot(dstPlayerSlot)) {
            return false;
        }

        // Take care changing colors with an active seat!
        if (srcFaction) {
            new PlayerDeskSetup(this).cleanFaction();
        }
        if (srcSetup) {
            new PlayerDeskSetup(this).cleanGeneric();
        }
        if (dstFaction) {
            new PlayerDeskSetup(swapWith).cleanFaction();
        }
        if (dstSetup) {
            new PlayerDeskSetup(swapWith).cleanGeneric();
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
            swapWith._plasticColor = srcPlasticColorTint;
            swapWith._playerSlot = srcPlayerSlot;
        }

        this._colorName = dstColorName;
        this._color = dstColorTint;
        this._plasticColor = dstPlasticColorTint;
        this._playerSlot = dstPlayerSlot;

        // Desks are reset.  Move players to desks.
        if (srcPlayer) {
            srcPlayer.switchSlot(dstPlayerSlot);
        }
        if (dstPlayer) {
            dstPlayer.switchSlot(srcPlayerSlot);
        }

        // Recreate initial setup/faction state.
        if (srcSetup) {
            new PlayerDeskSetup(this).setupGeneric();
        }
        if (srcFaction) {
            new PlayerDeskSetup(this).setupFaction();
        }
        if (dstSetup) {
            new PlayerDeskSetup(swapWith).setupGeneric();
        }
        if (dstFaction) {
            new PlayerDeskSetup(swapWith).setupFaction();
        }

        this.resetUI();
        if (swapWith) {
            swapWith.resetUI();
        }

        this.saveDesksState();

        return true;
    }

    setReady(value) {
        this._ready = value;
        this.saveDesksState();
    }

    saveDesksState() {
        // Save slots and tint colors for reload.
        const deskState = [];
        for (let i = 0; i < _playerDesks.length; i++) {
            deskState.push({
                c: ColorUtil.colorToHex(_playerDesks[i].color),
                pc: ColorUtil.colorToHex(_playerDesks[i].plasticColor),
                cn: _playerDesks[i].colorName,
                s: _playerDesks[i]._playerSlot,
                r: _playerDesks[i]._ready,
            });
        }
        GlobalSavedData.set(GLOBAL_SAVED_DATA_KEY.DESK_STATE, deskState);
    }

    /**
     * Has the player marked the desk as ready?
     *
     * @returns {boolean}
     */
    isDeskReady() {
        return this._ready;
    }

    /**
     * Has this desk been setup?  That is, per-desk items unpacked.
     *
     * @returns {boolean}
     */
    isDeskSetup() {
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

module.exports = { PlayerDesk };
