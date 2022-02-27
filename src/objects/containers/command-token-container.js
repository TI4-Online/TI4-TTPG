const assert = require("../../wrapper/assert-wrapper");
const { world, refObject, Container } = require("../../wrapper/api");

const DELAY = 3000; // delay in milliseconds

class Reporter {
    constructor(container) {
        assert(container instanceof Container);
        this._container = container;

        // arrow functions necessary to get proper "this" value
        this._container.onInserted.add((container, objects, player) =>
            this.countInserted(container, objects, player)
        );
        this._container.onRemoved.add((container, objects, player) =>
            this.countRemoved(container, objects, player)
        );

        this._insertedCounter = 0;
        this._firstInserted = false;

        this._removedCounter = 0;
        this._firstRemoved = false;
    }

    countInserted(_container, objects, _player) {
        this._insertedCounter += objects.length;
        if (!this._firstInserted) {
            this._firstInserted = true;
            setTimeout(() => {
                console.log(`${this._insertedCounter} tokens returned`);
                this._insertedCounter = 0;
                this._firstInserted = false;
            }, DELAY);
        }
    }

    countRemoved(_container, _object, _player) {
        this._removedCounter++;
        if (!this._firstRemoved) {
            this._firstRemoved = true;
            setTimeout(() => {
                console.log(`${this._removedCounter} tokens taken`);
                this._removedCounter = 0;
                this._firstRemoved = false;
            }, DELAY);
        }
    }
}

new Reporter(refObject);
