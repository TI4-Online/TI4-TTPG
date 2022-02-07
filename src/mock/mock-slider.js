const TextWidgetBase = require("./mock-text-widget-base");
const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class Slider extends TextWidgetBase {
    constructor(data) {
        super(data);
        this._stepSize = (data && data.stepSize) || undefined;
        this._maxValue = (data && data.maxValue) || undefined;
    }

    setStepSize(size) {
        this._stepSize = size;
        return this;
    }

    getStepSize() {
        return this._stepSize;
    }

    setMaxValue(maxValue) {
        this._maxValue = maxValue;
        return this;
    }

    getMaxValue() {
        return this._maxValue;
    }

    onValueChanged = new TriggerableMulticastDelegate();
}

module.exports = Slider;
