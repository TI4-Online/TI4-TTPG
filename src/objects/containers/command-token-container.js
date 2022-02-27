const assert = require("../../wrapper/assert-wrapper");
const { refContainer, Container } = require("../../wrapper/api");
const {
    getRejectReason,
    REJECT_REASON,
} = require("../../global/patch-exclusive-bags");
const { ObjectNamespace } = require("../../lib/object-namespace");

const DELAY = 3000; // delay in milliseconds

function holdsObject(container, object) {
    const containerName = ObjectNamespace.parseGeneric(container).name;
    const rejectReason = getRejectReason(container, object);

    // command token bags have name "*"
    // not sure if this is a bug from when they get spawned or caused by
    // using refContainer
    if (rejectReason === REJECT_REASON.MISMATCH_NAME && containerName === "*") {
        return true;
    }
    return !rejectReason;
}

class Reporter {
    constructor(container) {
        assert(container instanceof Container);
        this._container = container;

        // arrow functions necessary to get proper "this" value
        this._container.onInserted.add((container, objects, player) =>
            this.countInserted(container, objects, player)
        );
        this._container.onRemoved.add((container, object, player) =>
            this.countRemoved(container, object, player)
        );

        this._insertedCounter = 0;
        this._firstInserted = false;

        this._removedCounter = 0;
        this._firstRemoved = false;
    }

    countInserted(container, objects, _player) {
        // ensure each inserted object belongs in the container before counting
        // it toward the number of inserted objects
        let addedValidObject = false;
        for (const obj of objects) {
            if (!holdsObject(container, obj)) {
                continue;
            }
            this._insertedCounter++;
            addedValidObject = true;
        }
        if (addedValidObject && !this._firstInserted) {
            this._firstInserted = true;
            setTimeout(() => {
                console.log(`${this._insertedCounter} tokens returned`);
                this._insertedCounter = 0;
                this._firstInserted = false;
            }, DELAY);
        }
    }

    countRemoved(container, object, _player) {
        // ensure the object belongs in the container before counting it
        // towards the number of removed objects
        if (!holdsObject(container, object)) {
            return;
        }
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

new Reporter(refContainer);
