const assert = require("../wrapper/assert-wrapper");
const { ColorUtil } = require("./color/color-util");
const { Color, Player, globalEvents, world } = require("../wrapper/api");

class Broadcast {
    static get ERROR() {
        return [1, 0, 0, 1];
    }

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

    static broadcastOne(player, message, color = [1, 1, 1, 1]) {
        assert(player instanceof Player);
        assert(typeof message === "string");

        if (Array.isArray(color)) {
            color = new Color(color[0], color[1], color[2], color[3] || 1);
        }
        assert(ColorUtil.isColor(color));

        player.showMessage(message);
        Broadcast.chatOne(player, message, color);
    }

    static chatOne(player, message, color = [1, 1, 1, 1]) {
        assert(player instanceof Player);
        assert(typeof message === "string");

        if (Array.isArray(color)) {
            color = new Color(color[0], color[1], color[2], color[3] || 1);
        }
        assert(ColorUtil.isColor(color));

        player.sendChatMessage(message, color);
        if (!world.__isMock) {
            console.log(">> " + message);
        }
    }

    static chatAllExcept(exceptPlayers, message, color = [1, 1, 1, 1]) {
        assert(Array.isArray(exceptPlayers));
        assert(typeof message === "string");

        if (Array.isArray(color)) {
            color = new Color(color[0], color[1], color[2], color[3] || 1);
        }
        assert(ColorUtil.isColor(color));

        for (const player of world.getAllPlayers()) {
            if (!exceptPlayers.includes(player)) {
                player.sendChatMessage(message, color);
            }
        }
        if (!world.__isMock) {
            console.log(">> " + message);
        }
    }
}

module.exports = { Broadcast };
