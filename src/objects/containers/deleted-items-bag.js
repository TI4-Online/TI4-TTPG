const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { globalEvents, refObject, world } = require("../../wrapper/api");

const IGNORE_SET = new Set([
    "token:base/fighter_1",
    "token:base/fighter_3",
    "token:base/infantry_1",
    "token:base/infantry_3",
    "token:base/tradegood_commodity_1",
    "token:base/tradegood_commodity_3",
    "token:pok/frontier",
]);

const IGNORE_TAG = "DELETED_ITEMS_IGNORE";

globalEvents.onObjectDestroyed.add((obj) => {
    if (obj.getTags().includes(IGNORE_TAG)) {
        return;
    }
    const nsid = ObjectNamespace.getNsid(obj);
    if (nsid.length === 0 || IGNORE_SET.has(nsid)) {
        return;
    }

    const json = obj.toJSONString();
    const pos = refObject.getPosition().add([0, 0, 10]);
    const clone = world.createObjectFromJSON(json, pos);
    refObject.addObjects([clone]);
});

refObject.addCustomAction("*" + locale("ui.maptool.clear"));
refObject.onCustomAction.add((obj, player, actionName) => {
    refObject.clear();
});
