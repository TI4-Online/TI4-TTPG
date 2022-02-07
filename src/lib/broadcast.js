const assert = require("../wrapper/assert");
const { Color, world } = require("../wrapper/api");

class Broadcast {
    /**
     * Send a message to all players, both on-screen and in chat window.
     *
     * @param {string} message
     */
    static broadcastAll(message, color) {
        assert(typeof message === "string");
        assert(Array.isArray(color) || color instanceof Color);

        for (const player of world.getAllPlayers()) {
            player.showMessage(player);
        }
        Broadcast.chatAll(message, color);
    }

    /**
     * Send a message to all players' chat windows.
     */
    static chatAll(message, color) {
        assert(typeof message === "string");
        assert(Array.isArray(color) || color instanceof Color);

        for (const player of world.getAllPlayers()) {
            player.sendChatMessage(player, color);
        }
    }
}

module.exports = { Broadcast };
