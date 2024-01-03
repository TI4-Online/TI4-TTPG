"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = require("@tabletop-playground/api");
var jsx_in_ttpg_1 = require("jsx-in-ttpg");
var group_1 = require("../ui/group");
var modal_1 = require("../ui/modal");
var interval_1 = require("../utility/interval");
var objWith_1 = require("../utility/objWith");
var lerp = function (t, a, b) { return a + t * (b - a); };
var setupBillboards = function (gameObject) {
    var adLeft = new api_1.UIElement();
    adLeft.position = new api_1.Vector(7, 0, -6);
    adLeft.twoSided = true;
    adLeft.anchorX = 0.5;
    adLeft.anchorY = 0.5;
    adLeft.rotation = new api_1.Rotator(-90 - 60, 0, 180);
    adLeft.scale = 0.375;
    adLeft.useTransparency = true;
    var adRight = new api_1.UIElement();
    adRight.position = new api_1.Vector(-7, 0, -6);
    adRight.twoSided = true;
    adRight.anchorX = 0.5;
    adRight.anchorY = 0.5;
    adRight.rotation = new api_1.Rotator(90 + 60, 0, 0);
    adRight.scale = 0.375;
    adRight.useTransparency = true;
    var leftRef = (0, jsx_in_ttpg_1.useRef)();
    var rightRef = (0, jsx_in_ttpg_1.useRef)();
    adLeft.widget = (0, jsx_in_ttpg_1.render)((0, jsx_in_ttpg_1.jsxInTTPG)("image", { color: [1, 1, 1, 0.75], ref: leftRef }));
    adRight.widget = (0, jsx_in_ttpg_1.render)((0, jsx_in_ttpg_1.jsxInTTPG)("image", { color: [1, 1, 1, 0.75], ref: rightRef }));
    gameObject.addUI(adLeft);
    gameObject.addUI(adRight);
    var setImage = function (url) {
        var _a, _b;
        if (url) {
            (_a = leftRef.current) === null || _a === void 0 ? void 0 : _a.setImageURL(url);
            (_b = rightRef.current) === null || _b === void 0 ? void 0 : _b.setImageURL(url);
        }
    };
    return setImage;
};
var setup = function (gameObject) {
    var _a = (0, objWith_1.useState)(gameObject, "movement", {
        height: 100,
        mode: "hover",
        omega: 1,
    }), movement = _a[0], saveMovement = _a[1];
    var _b = (0, objWith_1.useState)(gameObject, "adverts", {
        mode: "sequential",
        delay: 10,
        variance: 2,
        ads: [],
    }), adverts = _b[0], saveAdverts = _b[1];
    var setAdImage = setupBillboards(gameObject);
    var currentAd = 0;
    var interval = (0, interval_1.createInterval)(function () {
        if (adverts.ads.length > 0) {
            if (adverts.mode === "sequential") {
                currentAd = (currentAd + 1) % adverts.ads.length;
                setAdImage(adverts.ads[currentAd]);
            }
            if (adverts.mode === "random") {
                currentAd = Math.floor(lerp(Math.random(), 0, adverts.ads.length - 1));
                setAdImage(adverts.ads[currentAd]);
            }
        }
    }, adverts.delay, adverts.variance).start(true);
    gameObject.addCustomAction("Scaffolding Options", "Edit Scaffolding Adverts and Movement", "scaffold_options");
    var handleOptions = function (obj, player, id) {
        if (id === "scaffold_options") {
            //orbitDisplay.players = new PlayerPermission().addPlayer(player);
            var menu_1 = new api_1.ScreenUIElement();
            menu_1.anchorX = 0.5;
            menu_1.anchorY = 0.5;
            menu_1.positionX = 0.5;
            menu_1.positionY = 0.5;
            menu_1.width = 640;
            menu_1.height = 480;
            var onClose = function () {
                api_1.world.removeScreenUIElement(menu_1);
                saveMovement();
                saveAdverts();
            };
            var setMoveMode = function (select, player, idx, newMode) {
                switch (newMode) {
                    case "hover":
                        movement.mode = "hover";
                        break;
                    case "spin":
                        movement.mode = "spin";
                        break;
                }
                restartMovement(obj);
            };
            var setAdvertMode = function (select, player, idx, newMode) {
                switch (newMode) {
                    case "sequential":
                        adverts.mode = "sequential";
                        interval.start();
                        break;
                    case "random":
                        adverts.mode = "random";
                        interval.start();
                        break;
                }
            };
            var listRef_1 = (0, jsx_in_ttpg_1.useRef)();
            var removeAd_1 = function (index) {
                adverts.ads = adverts.ads.filter(function (v, i) { return i !== index; });
                saveAdverts();
                refreshList_1();
            };
            var setAd_1 = function (index, url) {
                if (index < adverts.ads.length) {
                    adverts.ads[index] = url;
                    saveAdverts();
                }
            };
            var addAd = function () {
                adverts.ads.push("");
                saveAdverts();
                refreshList_1();
            };
            var composeList_1 = function (list) {
                return list.map(function (url, i) {
                    return ((0, jsx_in_ttpg_1.jsxInTTPG)("horizontalbox", { gap: 10 },
                        (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("input", { value: url, onCommit: function (w, p, v) {
                                setAd_1(i, v);
                            } })),
                        (0, jsx_in_ttpg_1.jsxInTTPG)("button", { onClick: function () {
                                removeAd_1(i);
                            } }, "-")));
                });
            };
            var refreshList_1 = function () {
                var _a;
                (_a = listRef_1.current) === null || _a === void 0 ? void 0 : _a.removeAllChildren();
                composeList_1(adverts.ads).map(function (el) {
                    var _a;
                    (_a = listRef_1.current) === null || _a === void 0 ? void 0 : _a.addChild((0, jsx_in_ttpg_1.render)(el));
                });
            };
            menu_1.widget = (0, jsx_in_ttpg_1.render)((0, jsx_in_ttpg_1.jsxInTTPG)(modal_1.Modal, { onClose: onClose, title: "Blimp Options", padding: 4 },
                (0, jsx_in_ttpg_1.jsxInTTPG)("verticalbox", null,
                    (0, jsx_in_ttpg_1.jsxInTTPG)(group_1.Group, { label: "Movement", padding: 8, margin: 4 },
                        (0, jsx_in_ttpg_1.jsxInTTPG)("horizontalbox", { gap: 8, valign: api_1.VerticalAlignment.Center },
                            (0, jsx_in_ttpg_1.jsxInTTPG)("text", null, "Mode:"),
                            (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("select", { options: ["hover", "spin"], value: movement.mode, onChange: setMoveMode })),
                            (0, jsx_in_ttpg_1.jsxInTTPG)("text", null, "Height:"),
                            (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("input", { type: "positive-integer", value: "".concat(movement.height), onCommit: function (w, p, v) {
                                    var t = Number(v);
                                    if (!isNaN(t)) {
                                        movement.height = t;
                                        restartMovement(gameObject);
                                    }
                                } })),
                            (0, jsx_in_ttpg_1.jsxInTTPG)("text", null, "Spin Rate:"),
                            (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("input", { type: "positive-float", value: "".concat(movement.omega), onCommit: function (w, p, v) {
                                    var t = Number(v);
                                    if (!isNaN(t)) {
                                        movement.omega = t;
                                        restartMovement(gameObject);
                                    }
                                } })))),
                    (0, jsx_in_ttpg_1.jsxInTTPG)(group_1.Group, { label: "Adverts", padding: 8, margin: 4 },
                        (0, jsx_in_ttpg_1.jsxInTTPG)("verticalbox", { gap: 4 },
                            (0, jsx_in_ttpg_1.jsxInTTPG)("horizontalbox", { gap: 8, valign: api_1.VerticalAlignment.Center },
                                (0, jsx_in_ttpg_1.jsxInTTPG)("text", null, "Mode:"),
                                (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("select", { options: ["sequential", "random"], value: adverts.mode, onChange: setAdvertMode })),
                                (0, jsx_in_ttpg_1.jsxInTTPG)("text", null, "Delay (s):"),
                                (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("input", { value: "".concat(adverts.delay), type: "positive-integer", onCommit: function (w, p, v) {
                                        var t = Number(v);
                                        if (!isNaN(t)) {
                                            adverts.delay = t;
                                            interval.setDelay(t, adverts.variance);
                                        }
                                    } })),
                                (0, jsx_in_ttpg_1.jsxInTTPG)("text", null, "Variance (s):"),
                                (0, jsx_in_ttpg_1.boxChild)(1, (0, jsx_in_ttpg_1.jsxInTTPG)("input", { value: "".concat(adverts.variance), type: "positive-integer", onCommit: function (w, p, v) {
                                        var t = Number(v);
                                        if (!isNaN(t)) {
                                            interval.setDelay(adverts.delay, t);
                                            adverts.variance = t;
                                        }
                                    } })),
                                (0, jsx_in_ttpg_1.jsxInTTPG)("button", { onClick: addAd }, "+")),
                            (0, jsx_in_ttpg_1.jsxInTTPG)("verticalbox", { gap: 4, ref: listRef_1 }, composeList_1(adverts.ads)))))));
            api_1.world.addScreenUI(menu_1);
        }
    };
    gameObject.onCustomAction.add(handleOptions);
    var handleTick = function (obj, delta) {
        if (movement.mode === "spin") {
            var rot = obj.getRotation();
            obj.setRotation([0, (rot[1] + delta * movement.omega) % 360, 0]);
        }
    };
    var handleGrab = function (obj) {
        obj.onTick.remove(handleTick);
    };
    var restartMovement = function (obj) {
        obj.onTick.remove(handleTick);
        startMovement(obj);
    };
    var startMovement = function (obj) {
        obj.freeze();
        var pos = obj.getPosition();
        if (movement.mode === "spin") {
            obj.setPosition([pos.x, pos.y, movement.height]);
            obj.onTick.add(handleTick);
        }
        else if (movement.mode === "hover") {
            obj.setPosition([pos.x, pos.y, movement.height]);
        }
    };
    gameObject.onReleased.add(startMovement);
    gameObject.onCreated.add(startMovement);
    gameObject.onGrab.add(handleGrab);
    startMovement(gameObject);
};
setup(api_1.refObject);
