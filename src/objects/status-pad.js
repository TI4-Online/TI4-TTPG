const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const { ObjectSavedData } = require("../lib/saved-data/object-saved-data");
const TP = require("../wrapper/api");

const btnUI = new TP.UIElement();
const pnlUI = new TP.UIElement();

btnUI.position = new TP.Vector(1.5, 0, 0.2);
btnUI.rotation = new TP.Rotator(0, 0, 180);
btnUI.scale = 0.1;
btnUI.widget = new TP.LayoutBox();

btnUI.widget.setVerticalAlignment(0);
btnUI.widget.setHorizontalAlignment(0);
btnUI.widget.setMinimumWidth(600);
btnUI.widget.setMinimumHeight(200);

pnlUI.position = new TP.Vector(-0.5, 0, 0.8);
pnlUI.rotation = new TP.Rotator(15, 0, 0);
pnlUI.scale = 0.1;
pnlUI.widget = new TP.LayoutBox();
pnlUI.useTransparency = true;

pnlUI.widget.setVerticalAlignment(0);
pnlUI.widget.setHorizontalAlignment(2);
pnlUI.widget.setMinimumWidth(600);
pnlUI.widget.setMinimumHeight(450);

const obj = TP.refObject; // get reference now, cannot use later
const packageId = TP.refPackageId;

const awayButton = new TP.Button()
    .setText(locale("ui.button.away"))
    .setFontSize(48);
const passButton = new TP.Button()
    .setText(locale("ui.button.pass"))
    .setFontSize(48);

const awayImage = new TP.ImageWidget();
const passImage = new TP.ImageWidget();

btnUI.widget.setChild(
    new TP.Border().setChild(
        new TP.HorizontalBox()
            .addChild(awayButton, 1)
            .addChild(passButton, 1)
            .setChildDistance(10)
    )
);

pnlUI.widget.setChild(
    new TP.HorizontalBox().addChild(passImage).addChild(awayImage)
);

TP.refObject.addUI(btnUI);
TP.refObject.addUI(pnlUI);

function getAway() {
    return ObjectSavedData.get(obj, "isAway", false);
}

function setAway(value) {
    assert(typeof value === "boolean");
    ObjectSavedData.set(obj, "isAway", value);
    awayImage.setImage(
        value ? "locale/ui/panel_away_on.png" : "locale/ui/panel_away_off.png",
        packageId
    );
}

function getPass() {
    return ObjectSavedData.get(obj, "isPass", false);
}

function setPass(value) {
    assert(typeof value === "boolean");
    ObjectSavedData.set(obj, "isPass", value);
    passImage.setImage(
        value ? "locale/ui/panel_pass_on.png" : "locale/ui/panel_pass_off.png",
        packageId
    );
}

awayButton.onClicked = (btn, player) => {
    const newValue = !getAway();
    setAway(newValue);

    const playerSlot = obj.getOwningPlayerSlot();
    const playerDesk = TP.world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    const faction = TP.world.TI4.getFactionByPlayerSlot(playerSlot);
    const playerName = faction ? faction.nameFull : playerDesk.colorName;
    const localeMsg = newValue
        ? "ui.message.player_away"
        : "ui.message.player_here";
    const msg = locale(localeMsg, { playerName });
    const color = playerDesk ? playerDesk.color : player.getPlayerColor();
    Broadcast.broadcastAll(msg, color);
};

passButton.onClicked = (btn, player) => {
    const newValue = !getPass();
    setPass(newValue);
    if (newValue) {
        // Announce pass.
        const playerSlot = obj.getOwningPlayerSlot();
        const playerDesk = TP.world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const faction = TP.world.TI4.getFactionByPlayerSlot(playerSlot);
        const playerName = faction ? faction.nameFull : playerDesk.colorName;
        const color = playerDesk ? playerDesk.color : player.getPlayerColor();
        const msg = locale("ui.message.player_pass", { playerName });
        Broadcast.broadcastAll(msg, color);

        // Since this was a player click, also end turn.
        const currentDesk = TP.world.TI4.turns.getCurrentTurn();
        if (currentDesk === playerDesk) {
            TP.world.TI4.turns.endTurn(player);
        }
    }
};

TP.globalEvents.TI4.onTurnOrderEmpty.add((player) => {
    setPass(false);
});

TP.refObject.__getPass = () => {
    return getPass();
};

TP.refObject.__setPass = (value) => {
    assert(typeof value === "boolean");
    setPass(value);
};

// "Set" the current values to update UI.
setPass(getPass());
setAway(getAway());
