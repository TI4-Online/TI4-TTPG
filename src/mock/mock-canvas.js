const Widget = require("./mock-widget");

class Canvas extends Widget {
    addChild() {
        return this;
    }
}

module.exports = Canvas;
