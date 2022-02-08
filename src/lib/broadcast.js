const assert = require("../wrapper/assert-wrapper");
const { Color, world } = require("../wrapper/api");

class Broadcast {
    /**
     * Send a message to all players, both on-screen and in chat window.
     *
     * @param {string} message
     */
    static broadcastAll(message, color = [1, 1, 1, 1]) {
        assert(typeof message === "string");
        assert(Array.isArray(color) || color instanceof Color);

        for (const player of world.getAllPlayers()) {
            player.showMessage(message);
        }
        Broadcast.chatAll(message, color);
    }

    /**
     * Send a message to all players' chat windows.
     */
    static chatAll(message, color = [1, 1, 1, 1]) {
        assert(typeof message === "string");
        assert(Array.isArray(color) || color instanceof Color);

        for (const player of world.getAllPlayers()) {
            player.sendChatMessage(message, color);
        }
        if (!world.__isMock) {
            console.log(">> " + message);
        }
    }
}

module.exports = { Broadcast };
