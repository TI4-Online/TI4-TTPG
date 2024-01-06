/**
 * Lay out tiles to form a milty slice, action to spit out overall config
 * string (look for peers, use their slices too).
 */
class MiltySliceBuilderHelper {
    constructor(obj) {
        assert(obj instanceof GameObject);
        this._obj = obj;

        // use a DrawingLine to outline the shape instead of a zone!!!

        // maybe this is a dedicated table, with lines already drawn?
        // homebrew system tile support?
        obj.onGrab.add();
        obj.onMovementStopped.add();
        obj.onReleased.add(); // what if dropped into a container?
        obj.onDestroyed.add();
    }
}
