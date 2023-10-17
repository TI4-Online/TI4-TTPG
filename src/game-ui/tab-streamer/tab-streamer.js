const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { TabStreamerUI } = require("./tab-streamer-ui");
const { Player, world } = require("../../wrapper/api");
const {
    AutoStreamerCamera,
} = require("../../lib/streamer/auto-streamer-camera");

class TabStreamer {
    constructor() {
        const onClickHandlers = {
            toggleHideCursor: (button, player) => {
                assert(player instanceof Player);
                const playerSlot = player.getSlot();
                world.TI4.hideCursor.togglePlayerSlot(playerSlot);
            },
            buddy: (button, player) => {
                const key = "buddy";
                world.TI4.gameData.setStreamerOverlayKey(key);
                world.TI4.gameData.enable();
                Broadcast.chatAll(
                    locale("ui.message.enabling_game_data", {
                        key,
                    })
                );
            },
            autoStreamerCamera: (button, player) => {
                assert(player instanceof Player);
                if (AutoStreamerCamera.disconnectIfActive(player)) {
                    Broadcast.chatAll(
                        `Disconnected AutoStreamerCamera from ${player.getName()}`
                    );
                } else {
                    new AutoStreamerCamera(player);
                    Broadcast.chatAll(
                        `Connected AutoStreamerCamera to ${player.getName()}`
                    );
                }
            },
        };

        this._ui = new TabStreamerUI(onClickHandlers);
    }

    getUI() {
        return this._ui.getWidget();
    }
}

module.exports = { TabStreamer };
