"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useState = exports.refObjectWith = void 0;
var refObjectWith = function (obj, init) {
    return Object.entries(init).reduce(function (acc, _a) {
        var k = _a[0], v = _a[1];
        acc[k] = v;
        return acc;
    }, obj);
};
exports.refObjectWith = refObjectWith;
var parseSafely = function (thing) {
    if (thing !== "") {
        try {
            return JSON.parse(thing);
        }
        catch (_a) { }
    }
};
var useState = function (obj, key, init) {
    var _a;
    var value = (_a = parseSafely(obj.getSavedData(key))) !== null && _a !== void 0 ? _a : init;
    var save = function () {
        obj.setSavedData(JSON.stringify(value), key);
    };
    return [value, save];
};
exports.useState = useState;
