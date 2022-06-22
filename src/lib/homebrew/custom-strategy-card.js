const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    Canvas,
    GameObject,
    Text,
    TextBox,
    UIElement,
    Vector,
    refObject,
    refPackageId,
    world,
} = require("../../wrapper/api");

const KEY = {
    TITLE: "title",
    INITIATIVE: "initiative",
    PRIMARY_TITLE: "primary_title",
    PRIMARY_BODY: "primary_body",
    SECONDARY_TITLE: "secondary_title",
    SECONDARY_BODY: "secondary_body",
};

class CustomStrategyCard {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        this._obj = gameObject;
        this._ui = undefined;

        const editActionName = "*" + locale("ui.menu.edit");
        const saveActionName = "*" + locale("ui.menu.save");
        this._obj.addCustomAction(editActionName);
        this._obj.addCustomAction(saveActionName);
        this._obj.onCustomAction.add((obj, player, selectedActionName) => {
            if (selectedActionName === editActionName) {
                this.reset(true);
            }
            if (selectedActionName === saveActionName) {
                this.reset(false);
            }
        });
        this.reset(false);
    }

    reset(isEdit) {
        assert(typeof isEdit === "boolean");
        console.log("CustomStrategyCard.reset");

        if (this._ui) {
            this._obj.removeUIElement(this._ui);
            this._ui = undefined;
        }

        const scale = 8;
        const canvas = new Canvas();

        let value = this._obj.getSavedData(KEY.TITLE) || "TITLE";
        let text = isEdit ? new TextBox() : new Text();
        text.setFont("Handel_Gothic_Regular.otf", refPackageId)
            .setFontSize(4.5 * scale)
            .setText(value);
        let x = 5;
        let y = 0.7;
        let width = 42;
        let height = 7;
        canvas.addChild(
            text,
            x * scale,
            y * scale,
            width * scale,
            height * scale
        );
        if (isEdit) {
            text.onTextCommitted.add((textBox, player, text, usingEnter) => {
                this._obj.setSavedData(text, KEY.TITLE);
            });
        }

        value = this._obj.getSavedData(KEY.INITIATIVE) || "9";
        text = isEdit ? new TextBox().setInputType(2) : new Text();
        text.setFont("Handel_Gothic_Regular.otf", refPackageId)
            .setFontSize(9.5 * scale)
            .setText(value);
        x = 52;
        y = 0.5;
        width = 13;
        height = 13;
        if (value.length > 1) {
            text.setFontSize(6 * scale);
            x -= 2;
            y += 2;
        }
        canvas.addChild(
            text,
            x * scale,
            y * scale,
            width * scale,
            height * scale
        );
        this._obj.__initiative = Number.parseFloat(text.getText());
        if (Number.isNaN(this._obj.__initiative)) {
            this._obj.__initiative = 100;
        }
        console.log(
            `CustomStrategyCard.reset: initiative ${this._obj.__initiative}`
        );
        if (isEdit) {
            text.onTextCommitted.add((textBox, player, text, usingEnter) => {
                this._obj.setSavedData(text, KEY.INITIATIVE);
            });
        }

        value = this._obj.getSavedData(KEY.PRIMARY_TITLE) || "PRIMARY ABILITY:";
        text = new Text();
        text.setFont("Handel_Gothic_Regular.otf", refPackageId)
            .setFontSize(2.7 * scale)
            .setText(value);
        x = 5;
        y = 11.5;
        width = 50;
        height = 6;
        canvas.addChild(
            text,
            x * scale,
            y * scale,
            width * scale,
            height * scale
        );

        value =
            this._obj.getSavedData(KEY.PRIMARY_BODY) || "> Primary ability.";
        text = isEdit ? new TextBox().setMaxLength(255) : new Text();
        text.setFont("MyriadProSemibold.otf", refPackageId)
            .setFontSize(2.4 * scale)
            .setText(value);
        x = 5;
        y = 16.5;
        width = 50;
        height = 30;
        canvas.addChild(
            text,
            x * scale,
            y * scale,
            width * scale,
            height * scale
        );
        if (isEdit) {
            text.onTextCommitted.add((textBox, player, text, usingEnter) => {
                text = text.replace(/\\n/g, "\n");
                text = text.replace(/\\/g, "\n");
                this._obj.setSavedData(text, KEY.PRIMARY_BODY);
            });
        }

        value =
            this._obj.getSavedData(KEY.SECONDARY_TITLE) || "SECONDARY ABILITY:";
        text = new Text();
        text.setFont("Handel_Gothic_Regular.otf", refPackageId)
            .setFontSize(2.7 * scale)
            .setText(value);
        x = 5;
        y = 52.5;
        width = 66;
        height = 6;
        canvas.addChild(
            text,
            x * scale,
            y * scale,
            width * scale,
            height * scale
        );

        value =
            this._obj.getSavedData(KEY.SECONDARY_BODY) ||
            "> Secondary ability.";
        text = isEdit ? new TextBox().setMaxLength(255) : new Text();
        text.setFont("MyriadProSemibold.otf", refPackageId)
            .setFontSize(2.4 * scale)
            .setText(value);
        x = 5;
        y = 57.5;
        width = 40;
        height = 23;
        canvas.addChild(
            text,
            x * scale,
            y * scale,
            width * scale,
            height * scale
        );
        if (isEdit) {
            text.onTextCommitted.add((textBox, player, text, usingEnter) => {
                text = text.replace(/\\n/g, "\n");
                text = text.replace(/\\/g, "\n");
                this._obj.setSavedData(text, KEY.SECONDARY_BODY);
            });
        }

        this._ui = new UIElement();
        this._ui.width = 66 * scale; // 66
        this._ui.height = 83 * scale;
        this._ui.scale = 1 / scale;
        this._ui.position = new Vector(0, 0, 0.17);
        this._ui.useWidgetSize = false;
        this._ui.widget = canvas;
        this._obj.addUI(this._ui);
    }
}

refObject.onCreated.add((obj) => {
    new CustomStrategyCard(obj);
});
if (world.getExecutionReason() === "ScriptReload") {
    new CustomStrategyCard(refObject);
}
