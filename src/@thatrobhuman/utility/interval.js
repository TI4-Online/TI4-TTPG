"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInterval = void 0;
var lerp = function (t, a, b) { return a + t * (b - a); };
var createInterval = function (func, initialDelay, variance) {
    if (variance === void 0) { variance = 0; }
    var args = [];
    for (var _i = 3; _i < arguments.length; _i++) {
        args[_i - 3] = arguments[_i];
    }
    var delay = Math.max(0, initialDelay + lerp(Math.random(), variance / -2, variance / 2)) * 1000;
    var theInterval = null;
    var start = function (immediate) {
        if (immediate === void 0) { immediate = false; }
        if (theInterval !== null) {
            clearInterval(theInterval);
            theInterval = null;
        }
        theInterval = setInterval.apply(void 0, __spreadArray([func, delay], args, false));
        if (immediate) {
            func.apply(void 0, args);
        }
        return res;
    };
    var setDelay = function (d, v) {
        if (v === void 0) { v = 0; }
        delay = Math.max(0, d + lerp(Math.random(), v / -2, v / 2)) * 1000;
        if (theInterval !== null) {
            start();
        }
        return res;
    };
    var stop = function () {
        if (theInterval !== null) {
            clearInterval(theInterval);
            theInterval = null;
        }
        return res;
    };
    var res = {
        start: start,
        setDelay: setDelay,
        stop: stop,
    };
    return res;
};
exports.createInterval = createInterval;
