require("../global"); // register globalEvents.TI4
const assert = require("assert");
const { Broadcast } = require("./broadcast");
const { ColorUtil } = require("./color/color-util");
const { Color, globalEvents } = require("../wrapper/api");

it("onBroadcast event", () => {
    const recvMsgs = [];
    const recvColorsHex = [];
    globalEvents.TI4.onBroadcast.add((message, color) => {
        assert(typeof message === "string");
        assert(color instanceof Color);
        recvMsgs.push(message);
        recvColorsHex.push(ColorUtil.colorToHex(color));
    });

    Broadcast.broadcastAll("test1", [1, 0, 0]); // array color no alpha
    Broadcast.chatAll("test2"); // no color
    Broadcast.chatAll("test3", new Color(0, 0, 1)); // color

    assert.deepEqual(recvMsgs, ["test1", "test2", "test3"]);
    assert.deepEqual(recvColorsHex, ["#ff0000", "#ffffff", "#0000ff"]);
});
