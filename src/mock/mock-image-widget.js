const Widget = require("./mock-widget");

class ImageWidget extends Widget {
    constructor(data) {
        super(data);
    }

    setImage(path, packageId) {
        return this;
    }
    setImageSize(w, h) {
        return this;
    }
    setTintColor(value) {
        return this;
    }
}

module.exports = ImageWidget;
