const assert = require("../../wrapper/assert-wrapper");
const { Spawn } = require("../../setup/spawn/spawn");
const { GameObject, Player, Rotator, world } = require("../../wrapper/api");

/**
 * Spawn control tokens.
 */
class ControlToken {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Spawn a control token.
     *
     * @param {number} playerSlot
     * @returns {GameObject|undefined} control token, if have faction
     */
    static spawnControlToken(playerSlot, pos, rot) {
        assert(typeof playerSlot === "number");

        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        if (!faction) {
            return;
        }
        const tokenNsid = `token.control:${faction.nsidSource}/${faction.nsidName}`;
        const token = Spawn.spawn(tokenNsid, pos, rot);

        token.setOwningPlayerSlot(playerSlot);

        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (playerDesk) {
            token.setPrimaryColor(playerDesk.plasticColor);
        }

        return token;
    }

    static spawnOnSystem(systemTileObj, player) {
        assert(systemTileObj instanceof GameObject);
        assert(player instanceof Player);
        const playerSlot = player.getSlot();

        const pos = systemTileObj.getPosition().add([0, 0, 10]);
        const rot = systemTileObj.getRotation().compose(new Rotator(0, 90, 0));

        return ControlToken.spawnControlToken(playerSlot, pos, rot);
    }
}

module.exports = { ControlToken };
