"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = void 0;
var api_1 = require("@tabletop-playground/api");
var jsx_in_ttpg_1 = require("jsx-in-ttpg");
var Modal = function (_a) {
    var onClose = _a.onClose, children = _a.children, title = _a.title, padding = _a.padding;
    return ((0, jsx_in_ttpg_1.jsxInTTPG)("border", { color: [0, 0, 0, 1] },
        (0, jsx_in_ttpg_1.jsxInTTPG)("layout", null,
            (0, jsx_in_ttpg_1.jsxInTTPG)("verticalbox", null,
                (0, jsx_in_ttpg_1.jsxInTTPG)("border", { color: [0.05, 0.05, 0.05, 1] },
                    (0, jsx_in_ttpg_1.jsxInTTPG)("horizontalbox", { valign: api_1.VerticalAlignment.Center },
                        (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("text", { justify: api_1.TextJustification.Center }, title)),
                        (0, jsx_in_ttpg_1.jsxInTTPG)("button", { onClick: onClose }, "Close"))),
                (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("layout", { padding: padding }, children))))));
};
exports.Modal = Modal;
