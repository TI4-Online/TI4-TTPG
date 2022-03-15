const TextWidgetBase = require("./mock-text-widget-base");
const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class Slider extends TextWidgetBase {
    constructor(data) {
        super(data);
        this._stepSize = (data && data.stepSize) || undefined;
        this._maxValue = (data && data.maxValue) || undefined;
        this._minValue = (data && data.minValue) || undefined;
    }

    getMaxValue() {
        return this._maxValue;
    }

    getMinValue() {
        return this._minValue;
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
    setMinValue(minValue) {
        this._minValue = minValue;
        return this;
    }

    setTextBoxWidth(value) {
        return this;
    }

    setValue(value) {
        return this;
    }

    onValueChanged = new TriggerableMulticastDelegate();
}

module.exports = Slider;
