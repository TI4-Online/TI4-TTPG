const MockRotator = require("./mock-rotator");
const MockVector = require("./mock-vector");

class UIElement {
    constructor() {
        this.height = 90;
        this.position = new MockVector(0, 0, 0);
        this.rotation = new MockRotator(0, 0, 0);
        this.scale = 1;
        this.useWidgetSize = true;
        this.widget = undefined;
        this.width = 160;
    }
}

module.exports = UIElement;
