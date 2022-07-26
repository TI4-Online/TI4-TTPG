/**
 * Interpose on some API classes to expose internal state for monkeying.
 */
const assert = require("../../../wrapper/assert-wrapper");
const TriggerableMulticastDelegate = require("../../../lib/triggerable-multicast-delegate");
const api = require("../../../wrapper/api");
const { Button, Canvas, ImageButton, Player } = api;

class MonkeyButton extends Button {
    constructor() {
        super();

        const delegate = new TriggerableMulticastDelegate();

        // Redirect underlying event to interposed version.
        this.onClicked.add((button, player) => {
            assert(button instanceof Button);
            assert(player instanceof Player);
            delegate.trigger(button, player);
        });

        // Replace delegate functions (cannot overwrite onClicked).
        this.onClicked.add = (f) => {
            delegate.add(f);
        };
        this.onClicked.clear = () => {
            delegate.clear();
        };
        this.onClicked.remove = (f) => {
            delegate.remove(f);
        };
        this.onClicked.trigger = (button, player) => {
            delegate.trigger(button, player);
        };
    }
}

class MonkeyImageButton extends ImageButton {
    constructor() {
        super();

        const delegate = new TriggerableMulticastDelegate();

        // Redirect underlying event to interposed version.
        this.onClicked.add((button, player) => {
            assert(button instanceof Button);
            assert(player instanceof Player);
            delegate.trigger(button, player);
        });

        // Replace delegate functions (cannot overwrite onClicked).
        this.onClicked.add = (f) => {
            delegate.add(f);
        };
        this.onClicked.clear = () => {
            delegate.clear();
        };
        this.onClicked.remove = (f) => {
            delegate.remove(f);
        };
        this.onClicked.trigger = (button, player) => {
            delegate.trigger(button, player);
        };
    }
}

class MonkeyCanvas extends Canvas {
    constructor() {
        super();
        this._children = [];
    }

    addChild(child, x, y, width, height) {
        this._children.push(child);
        super.addChild(child, x, y, width, height);
    }

    removeChild(child) {
        this._children = this._children.filter((x) => x !== child);
        super.removeChild(child);
    }

    // Canvas does not have a getChildren method (yet).  Make one.
    getChildren() {
        return [...this._children];
    }
}

console.warn("*** MONKEY-INTERPOSE ACTIVE ***");
console.warn("*** MONKEY-INTERPOSE ACTIVE ***");
console.warn("*** MONKEY-INTERPOSE ACTIVE ***");
console.warn("*** MONKEY-INTERPOSE ACTIVE ***");
console.warn("*** MONKEY-INTERPOSE ACTIVE ***");
api.Button = MonkeyButton;
api.Canvas = MonkeyCanvas;
api.ImageButton = MonkeyImageButton;
