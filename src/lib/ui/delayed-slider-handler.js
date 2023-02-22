/**
 * Wait a moment before using a slider callback, make sure it hasn't changed.
 */

class DelayedSliderHandler {
    static wrap(handler) {
        return (slider, player, value) => {
            const delayed = () => {
                const newValue = slider.getValue();
                if (newValue === value) {
                    handler(slider, player, value);
                }
            };
            setTimeout(delayed, 1500);
        };
    }
}

module.exports = { DelayedSliderHandler };
