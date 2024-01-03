"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Group = void 0;
var jsx_in_ttpg_1 = require("jsx-in-ttpg");
var Group = function (_a) {
    var label = _a.label, children = _a.children, padding = _a.padding, margin = _a.margin, rest = __rest(_a, ["label", "children", "padding", "margin"]);
    return ((0, jsx_in_ttpg_1.jsxInTTPG)("layout", { padding: margin },
        (0, jsx_in_ttpg_1.jsxInTTPG)("verticalbox", __assign({}, rest),
            (0, jsx_in_ttpg_1.jsxInTTPG)("border", { color: [0.05, 0.05, 0.05, 1] },
                (0, jsx_in_ttpg_1.jsxInTTPG)("text", { size: 10 }, label)),
            (0, jsx_in_ttpg_1.jsxInTTPG)("layout", { padding: padding }, children))));
};
exports.Group = Group;
