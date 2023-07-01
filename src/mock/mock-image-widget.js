const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const Widget = require("./mock-widget");

class ImageWidget extends Widget {
    constructor(data) {
        super(data);
        this.onImageLoaded = new TriggerableMulticastDelegate();
    }

    setImage(path, packageId) {
        return this;
    }
    setImageSize(w, h) {
        return this;
    }
    setSourceCard(card) {
        return this;
    }
    setTintColor(value) {
        return this;
    }
}

module.exports = ImageWidget;
