const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const {
    Border,
    Button,
    LayoutBox,
    Player,
    world,
} = require("../../wrapper/api");

/**
 * Button for a draft selection.
 * - Once selected only the associated player can de-select it.
 * - Player may not select another item in the same category.
 */
class DraftSelectionButton extends Border {
    constructor(borderWidth) {
        super();

        this._owningPlayerSlot = -1;
        this._button = new Button();

        const box = new LayoutBox()
            .setChild(this._button)
            .setPadding(borderWidth, borderWidth, borderWidth, borderWidth);

        this.setChild(box);

        this._button.onClicked.add((button, player) => {
            assert(button instanceof Button);
            assert(player instanceof Player);

            const playerSlot = player.getSlot();

            if (this._owningPlayerSlot === -1) {
                this._claim(player);
            } else {
                if (this._owningPlayerSlot === playerSlot) {
                    this._release(player);
                } else {
                    this._reject(player);
                }
            }
        });
    }

    _claim(player) {
        assert(player instanceof Player);
        assert(this._owningPlayerSlot === -1);

        const playerSlot = player.getSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (!playerDesk) {
            console.log("DraftSelectionButton._claim: no player desk");
            return;
        }

        const msg = locale("ui.message.draft_claim", {
            playerName: "",
            item: "",
        });
        const color = playerDesk.color;
        Broadcast.broadcastAll(msg, color);

        this._owningPlayerSlot = playerSlot;
        this._update();
    }

    _release(player) {
        assert(player instanceof Player);
        assert(this._owningPlayerSlot === player.getSlot());
    }

    _reject(player) {
        assert(player instanceof Player);
        assert(
            this._owningPlayerSlot === -1 &&
                this._owningPlayerSlot !== player.getSlot()
        );
    }

    _update() {}

    get button() {
        return this._button;
    }
}

module.exports = { DraftSelectionButton };
