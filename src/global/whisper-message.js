const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const {
    PlayerPermission,
    globalEvents,
    refPackageId,
    world,
} = require("../wrapper/api");

const WHISPER_SOUND = "digi_blip_hi_2x.wav";

globalEvents.onWhisper.add((sender, receiver) => {
    const message = locale("ui.message.whisper", {
        senderName: sender.getName(),
        receiverName: receiver.getName(),
    });
    Broadcast.chatAll(message);

    if (WHISPER_SOUND) {
        const sound = world.importSound(WHISPER_SOUND, refPackageId);
        if (sound) {
            const playerPermission = new PlayerPermission();
            playerPermission.setPlayerSlots([receiver.getSlot()]);

            const startTime = 0;
            const volume = 0.5; // [0:2] range
            const loop = false;
            sound.play(startTime, volume, loop, playerPermission);
        }
    }
});
