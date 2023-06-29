const assert = require("../../wrapper/assert-wrapper");
const {
    Button,
    ContentButton,
    ImageButton,
    Player,
} = require("../../wrapper/api");
const { Broadcast } = require("../broadcast");

const THROTTLE_MSECS = 500;

/**
 * Reject repeat clicks if too soon since last click.
 */
class ThrottleClickHandler {
    /**
     * Wrap a single click handler.
     *
     * @param {function} clickHandler
     * @returns {function} replacement click handler
     */
    static wrap(clickHandler) {
        assert(typeof clickHandler === "function");
        const playerSlotToLastClickMsecs = {};
        return (button, player) => {
            assert(
                button instanceof Button ||
                    button instanceof ImageButton ||
                    button instanceof ContentButton
            );
            assert(player instanceof Player);

            const playerSlot = player.getSlot();
            const lastClickMsecs = playerSlotToLastClickMsecs[playerSlot];

            // Throttle if same player clicked again too soon.
            const nowMsecs = Date.now();
            if (lastClickMsecs && nowMsecs < lastClickMsecs + THROTTLE_MSECS) {
                Broadcast.chatAll(
                    "Throttling extra click event",
                    Broadcast.ERROR
                );
                console.log("throttle click");
                return;
            }
            playerSlotToLastClickMsecs[playerSlot] = nowMsecs;

            clickHandler(button, player);
        };
    }

    /**
     * Wrap the values in a dictionary.  Mutates the given object, return
     * in case caller wants to assign it at the same line.
     *
     * @param {Object.{key:string, value:function}} onButtonCallbacks
     * @return {Object.{key:string, value:function}}
     */
    static wrapValues(onButtonCallbacks) {
        for (const [key, value] of Object.entries(onButtonCallbacks)) {
            onButtonCallbacks[key] = ThrottleClickHandler.wrap(value);
        }
        return onButtonCallbacks;
    }

    /**
     * Wrap values in a dictionary.  Only propagate the first click to any
     * function (e.g. choosing agenda type).
     *
     * @param {Object.{key:string, value:function}} onButtonCallbacks
     * @return {Object.{key:string, value:function}}
     */
    static onlyOne(onButtonCallbacks) {
        let isClicked = false;
        for (const [key, value] of Object.entries(onButtonCallbacks)) {
            onButtonCallbacks[key] = (button, player) => {
                if (!isClicked) {
                    isClicked = true;
                    value(button, player);
                }
            };
        }
        return onButtonCallbacks;
    }
}

module.exports = { ThrottleClickHandler };
