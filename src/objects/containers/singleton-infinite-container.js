// Container must have "bag.x" NSID, content "x".
// Protect against accidental right-click empty with periodic fill?

const assert = require("../../wrapper/assert-wrapper");
const { Container, GameObject, refObject } = require("../../wrapper/api");
const { ObjectNamespace } = require("../../lib/object-namespace");

class SingletonInfiniteContainer {
    constructor(gameObject) {
        assert(gameObject);
        assert(gameObject instanceof GameObject);
        assert(gameObject instanceof Container);

        const nsid = ObjectNamespace.getNsid(gameObject);
        assert(nsid.startsWith("bag."));

        this._obj = gameObject;
        this._content = 
    }
}

new SingletonInfiniteContainer(refObject);
