const assert = require("../../wrapper/assert-wrapper");
const { Button, Player } = require("../../wrapper/api");

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
        let lastClickMsecs = 0;
        return (button, player) => {
            assert(button instanceof Button);
            assert(player instanceof Player);

            // Throttle if clicked again too soon.
            const nowMsecs = Date.now();
            if (nowMsecs < lastClickMsecs + THROTTLE_MSECS) {
                console.log("throttle click");
                return;
            }
            lastClickMsecs = nowMsecs;

            clickHandler(button, player);
        };
    }

    /**
     * Wrap the values in a dictionary.
     *
     * @param {Object.{key:string, value:function}} onButtonCallbacks
     */
    static wrapValues(onButtonCallbacks) {
        for (const [key, value] of Object.entries(onButtonCallbacks)) {
            onButtonCallbacks[key] = ThrottleClickHandler.wrap(value);
        }
    }
}

module.exports = { ThrottleClickHandler };
