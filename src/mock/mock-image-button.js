const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const Widget = require("./mock-widget");

class ImageButton extends Widget {
    constructor(data) {
        super(data);
    }

    onClicked = new TriggerableMulticastDelegate();

    setImage(path, packageId) {
        return this;
    }
    setImageSize(w, h) {
        return this;
    }
}

module.exports = ImageButton;
