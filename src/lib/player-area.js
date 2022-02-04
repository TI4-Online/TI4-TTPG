const assert = require("../wrapper/assert");
const {
    Button,
    Color,
    Player,
    Rotator,
    UIElement,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

/**
 * Desk positions in cm and rotation in degrees.  Z ignored.
 * First is "right", the counterclockwise about the table.
 */
const PLAYER_DESKS = [
    {
        pos: { x: 6.0544, y: 149.218, z: 3 },
        yaw: 180.0,
        defaultPlayerSlot: 5,
        minPlayerCount: 7,
    }, // pink
    {
        pos: { x: 96.9075, y: 99.7789, z: 3 },
        yaw: 117.5,
        defaultPlayerSlot: 1,
        minPlayerCount: 2,
    }, // green
    {
        pos: { x: 119.842, y: -6.0544, z: 3 },
        yaw: 90.0,
        defaultPlayerSlot: 16,
        minPlayerCount: 6,
    }, // red
    {
        pos: { x: 91.3162, y: -110.52, z: 3 },
        yaw: 62.5,
        defaultPlayerSlot: 9,
        minPlayerCount: 4,
    }, // yellow
    {
        pos: { x: -6.05441, y: -150.691, z: 3 },
        yaw: 0,
        defaultPlayerSlot: 6,
        minPlayerCount: 8,
    }, // orange
    {
        pos: { x: -96.29, y: -99.7789, z: 3 },
        yaw: -62.5,
        defaultPlayerSlot: 4,
        minPlayerCount: 3,
    }, // purple
    {
        pos: { x: -119.224, y: 6.05442, z: 3 },
        yaw: -90.0,
        defaultPlayerSlot: 15,
        minPlayerCount: 5,
    }, // blue
    {
        pos: { x: -90.6987, y: 110.52, z: 3 },
        yaw: -117.5,
        defaultPlayerSlot: 18,
        minPlayerCount: 1,
    }, // white
];

/**
 * Color values corresponding to TTPG player slots.
 */
const PLAYER_SLOT_COLORS = [
    { r: 0, g: 0.427, b: 0.858, a: 1 },
    { r: 0.141, g: 1, b: 0.141, a: 1 },
    { r: 0.572, g: 0, b: 0, a: 1 },
    { r: 0, g: 0.286, b: 0.286, a: 1 },
    { r: 0.286, g: 0, b: 0.572, a: 1 },
    { r: 1, g: 0.427, b: 0.713, a: 1 },
    { r: 0.858, g: 0.427, b: 0, a: 1 },
    { r: 0.572, g: 0.286, b: 0, a: 1 },
    { r: 0.713, g: 0.858, b: 1, a: 1 },
    { r: 1, g: 1, b: 0.427, a: 1 },
    { r: 0, g: 0.572, b: 0.572, a: 1 },
    { r: 1, g: 0.713, b: 0.466, a: 1 },
    { r: 0.713, g: 0.427, b: 1, a: 1 },
    { r: 0.427, g: 0.713, b: 1, a: 1 },
    { r: 0, g: 1, b: 1, a: 1 },
    { r: 0, g: 0, b: 1, a: 1 },
    { r: 1, g: 0, b: 0, a: 1 },
    { r: 0.215, g: 0.215, b: 0.215, a: 1 },
    { r: 1, g: 1, b: 1, a: 1 },
    { r: 0, g: 0, b: 0, a: 1 },
];

const DEFAULT_PLAYER_COUNT = 6;

let _playerCount = DEFAULT_PLAYER_COUNT;
let _claimSeatUIs = [];

// Bounce joining players to unseated.
globalEvents.onPlayerJoined.add((player) => {
    PlayerArea.moveNewPlayerToNonSeatSlot(player);
});

// Release seat when someone leaves.
globalEvents.onPlayerLeft.add((player) => {
    PlayerArea.resetUnusedSeats();
});

globalEvents.onPlayerSwitchedSlots.add((player, oldPlayerSlot) => {
    PlayerArea.resetUnusedSeats();
});

// Unseat host when first loading game.
const runOnce = () => {
    globalEvents.onTick.remove(runOnce);

    // If not reloading scripts move the host to a non-seat slot.
    if (world.getExecutionReason() !== "ScriptReload") {
        for (const player of world.getAllPlayers()) {
            PlayerArea.moveNewPlayerToNonSeatSlot(player);
        }
    }

    // Reset "take a seat" UI.
    PlayerArea.resetUnusedSeats();
};
globalEvents.onTick.add(runOnce);

/**
 * Manage player areas.
 */
class PlayerArea {
    /**
     * Reset number of seats at the table
     * (not physical desks, but those available for players).
     *
     * @param {number} value
     */
    static setPlayerCount(value) {
        assert(typeof value === "number");
        assert(1 <= value && value <= 8);
        _playerCount = value;

        if (!world.__isMock) {
            PlayerArea.resetUnusedSeats();
        }
    }

    /**
     * Move player to seat.
     *
     * @param {Vector} position
     * @param {Player} player
     */
    static seatPlayer(position, player) {
        assert(typeof position.x === "number"); // "instanceof Vector" broken
        assert(player instanceof Player);

        // Assume new seat.
        const seat = PlayerArea.getClosestSeat(position);
        player.switchSlot(PLAYER_DESKS[seat].defaultPlayerSlot);

        PlayerArea.resetUnusedSeats();
    }

    /**
     * Clear and reset "claim seat" buttons on available player desks.
     */
    static resetUnusedSeats() {
        // Remove old UI.
        for (const ui of _claimSeatUIs) {
            world.removeUI(ui);
        }
        _claimSeatUIs = [];

        for (const playerDesk of PlayerArea.getPlayerDesks()) {
            if (world.getPlayerBySlot(playerDesk.playerSlot)) {
                continue; // player in seat
            }

            const color = PlayerArea.getPlayerSlotColor(playerDesk.playerSlot);
            const button = new Button()
                .setTextColor(color)
                .setFontSize(50)
                .setText("TAKE SEAT");
            button.onClicked.add((button, player) => {
                this.seatPlayer(playerDesk.pos, player);
            });

            const ui = new UIElement();
            ui.position = playerDesk.pos.add([0, 0, 5]);
            ui.rotation = playerDesk.rot;
            ui.widget = button;

            _claimSeatUIs.push(ui);
            world.addUI(ui);
        }
    }

    /**
     * Move newly joined players to a non-seat player slot.
     *
     * @param {Player} player
     */
    static moveNewPlayerToNonSeatSlot(player) {
        assert(player instanceof Player);
        const reservedSlots = new Set();
        for (const playerDesk of PLAYER_DESKS) {
            reservedSlots.add(playerDesk.defaultPlayerSlot);
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
        console.log(
            `PlayerArea.moveNewPlayerToNonSeatSlot "${player.getName()}"`
        );
        for (let i = 0; i < 20; i++) {
            if (!reservedSlots.has(i)) {
                player.switchSlot(i);
                return;
            }
        }
        throw new Error("unable to find open slot");
    }

    /**
     * Get all player slots, accounting for current player count.
     *
     * @returns {Array.{Object.{pos:Vector,rot:Rotator,playerSlot:number}}}
     */
    static getPlayerDesks() {
        // Create new objects on every request b/c caller might mutate them.
        return PLAYER_DESKS.filter((playerDesk) => {
            return playerDesk.minPlayerCount <= _playerCount;
        }).map((playerDesk) => {
            assert(playerDesk.pos);
            assert(playerDesk.yaw);
            assert(playerDesk.defaultPlayerSlot);
            return {
                pos: new Vector(
                    playerDesk.pos.x,
                    playerDesk.pos.y,
                    world.getTableHeight() - 5
                ),
                rot: new Rotator(0, (playerDesk.yaw + 360 + 90) % 360, 0),
                playerSlot: playerDesk.defaultPlayerSlot,
            };
        });
    }

    /**
     * Get color associated with TTGP player slot.
     *
     * @param {number} playerSlot
     * @returns {Color}
     */
    static getPlayerSlotColor(playerSlot) {
        assert(typeof playerSlot === "number");
        const c = PLAYER_SLOT_COLORS[playerSlot];
        if (!c) {
            throw new Error(`bad player slot ${playerSlot}`);
        }
        return new Color(c.r, c.g, c.b, c.a);
    }

    /**
     * Get player seat closest to this position.
     *
     * @param {Vector} position
     * @returns {number} seat index of ALL player desks
     */
    static getClosestSeat(position) {
        assert(typeof position.x === "number"); // "instanceof Vector" broken

        let closestDistanceSq = Number.MAX_VALUE;
        let closestSeat = -1;

        // This might be called a lot, find without creating new objects.
        for (let i = 0; i < PLAYER_DESKS.length; i++) {
            const playerDesk = PLAYER_DESKS[i];
            if (playerDesk.minPlayerCount > _playerCount) {
                continue;
            }
            const dx = position.x - playerDesk.pos.x;
            const dy = position.y - playerDesk.pos.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < closestDistanceSq) {
                closestDistanceSq = dSq;
                closestSeat = i;
            }
        }
        if (closestSeat < 0) {
            throw new Error(`unable to find seat for ${position}`);
        }
        return closestSeat;
    }

    /**
     * Visualize the player area center / rotation.
     */
    static drawDebug() {
        const colorLine = new Color(0, 1, 0);
        const colorPoint = new Color(1, 0, 0);
        const duration = 10;
        const thicknessLine = 1;
        const sizePoint = thicknessLine * 3;

        let i = 0;
        for (const { pos, rot } of PlayerArea.getPlayerDeskPosRots()) {
            const dir = pos.add(
                rot.getForwardVector().multiply(sizePoint * 5 + i * 3)
            );
            i++;

            world.drawDebugPoint(pos, sizePoint, colorPoint, duration);
            world.drawDebugLine(pos, dir, colorLine, duration, thicknessLine);
        }
    }
}

module.exports = { PlayerArea, DEFAULT_PLAYER_COUNT };
