const { globalEvents } = require("../wrapper/api");
const { Broadcast } = require("../lib/broadcast");
const locale = require("../lib/locale");

globalEvents.onWhisper.add((sender, receiver) => {
    const message = locale("ui.message.whisper", {
        senderName: sender.getName(),
        receiverName: receiver.getName(),
    });
    Broadcast.chatAll(message);
});
