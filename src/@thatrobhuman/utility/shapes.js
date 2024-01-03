"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCirclePoints = void 0;
var api_1 = require("@tabletop-playground/api");
var getCirclePoints = function (center, radius, points) {
    points = Math.floor(points);
    var each = (2 * Math.PI) / points;
    var res = Array(points)
        .fill(0)
        .map(function (e, i) {
        return new api_1.Vector(radius * Math.cos(each * i), radius * Math.sin(each * i), center[2]);
    });
    res.push(res[0]);
    return res;
};
exports.getCirclePoints = getCirclePoints;
