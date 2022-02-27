const assert = require("../../wrapper/assert-wrapper");
const { world, refObject, Container } = require("../../wrapper/api");

const DELAY = 3000; // delay in milliseconds

class Reporter {
    constructor(container) {
        assert(container instanceof Container);
        this._container = container;

        // arrow functions necessary to get proper "this" value
        this._container.onInserted.add(() => this.countInserted());
        this._container.onRemoved.add(() => this.countRemoved());

        this._insertedCounter = 0;
        this._firstInserted = false;

        this._removedCounter = 0;
        this._firstRemoved = false;
    }

    countInserted() {
        this._insertedCounter++;
        if (!this._firstInserted) {
            this._firstInserted = true;
            console.log("STARTING INSERT DELAY");
            setTimeout(() => {
                console.log(`${this._insertedCounter} tokens returned`);
                this._insertedCounter = 0;
                this._firstInserted = false;
            }, DELAY);
        }
    }

    countRemoved() {
        this._removedCounter++;
        if (!this._firstRemoved) {
            this._firstRemoved = true;
            console.log("STARTING REMOVE DELAY");
            setTimeout(() => {
                console.log(`${this._removedCounter} tokens taken`);
                this._removedCounter = 0;
                this._firstRemoved = false;
            }, DELAY);
        }
    }
}

new Reporter(refObject);
