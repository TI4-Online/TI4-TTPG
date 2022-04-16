const assert = require("../wrapper/assert-wrapper");
const { ColorUtil } = require("./color/color-util");
const { Color, globalEvents, world } = require("../wrapper/api");

class Broadcast {
    /**
     * Send a message to all players, both on-screen and in chat window.
     *
     * @param {string} message
     */
    static broadcastAll(message, color = [1, 1, 1, 1]) {
        assert(typeof message === "string");

        if (Array.isArray(color)) {
            color = new Color(color[0], color[1], color[2], color[3] || 1);
        }
        assert(ColorUtil.isColor(color));

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

        if (Array.isArray(color)) {
            color = new Color(color[0], color[1], color[2], color[3] || 1);
        }
        assert(ColorUtil.isColor(color));

        for (const player of world.getAllPlayers()) {
            player.sendChatMessage(message, color);
        }
        if (!world.__isMock) {
            console.log(">> " + message);
        }
        globalEvents.TI4.onBroadcast.trigger(message, color);
    }
}

module.exports = { Broadcast };
