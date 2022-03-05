const TP = require("../wrapper/api");

const btnUI = new TP.UIElement();
const pnlUI = new TP.UIElement();

btnUI.position = new TP.Vector(1.5, 0, 0.2);
btnUI.rotation = new TP.Rotator(0, 0, 180);
btnUI.scale = 0.1;
btnUI.widget = new TP.LayoutBox();

btnUI.widget.setVerticalAlignment(0);
btnUI.widget.setHorizontalAlignment(0);
btnUI.widget.setMinimumWidth(300);
btnUI.widget.setMinimumHeight(100);

pnlUI.position = new TP.Vector(-0.5, 0, 0.8);
pnlUI.rotation = new TP.Rotator(15, 0, 0);
pnlUI.scale = 0.1;
pnlUI.widget = new TP.LayoutBox();
pnlUI.useTransparency = true;

pnlUI.widget.setVerticalAlignment(0);
pnlUI.widget.setHorizontalAlignment(0);
pnlUI.widget.setMinimumWidth(400);
pnlUI.widget.setMinimumHeight(300);

let isAway = false;
let isPass = false;

const awayButton = new TP.Button().setText("Away").setFontSize(24);
const passButton = new TP.Button().setText("Pass").setFontSize(24);

const awayImage = new TP.ImageWidget().setImage("locale/ui/panel_away_off.png");
const passImage = new TP.ImageWidget().setImage("locale/ui/panel_pass_off.png");

btnUI.widget.setChild(
    new TP.HorizontalBox()
        .addChild(awayButton, 1)
        .addChild(passButton, 1)
        .setChildDistance(10)
);

pnlUI.widget.setChild(
    new TP.HorizontalBox().addChild(passImage).addChild(awayImage)
);

awayButton.onClicked = (btn, player) => {
    isAway = !isAway;
    awayImage.setImage(
        isAway ? "locale/ui/panel_away_on.png" : "locale/ui/panel_away_off.png",
        btn.getOwningObject().getScriptPackageId()
    );
};

passButton.onClicked = (btn, player) => {
    isPass = !isPass;
    passImage.setImage(
        isPass ? "locale/ui/panel_pass_on.png" : "locale/ui/panel_pass_off.png",
        btn.getOwningObject().getScriptPackageId()
    );
};

TP.refObject.addUI(btnUI);
TP.refObject.addUI(pnlUI);
