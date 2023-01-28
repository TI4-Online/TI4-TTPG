const assert = require("../../../wrapper/assert-wrapper");
const {
    LayoutBox,
    Text,
    UIElement,
    UIZoomVisibility,
    Vector,
    VerticalBox,
    refObject,
    refPackageId,
    world,
} = require("../../../wrapper/api");

const UI_SCALE = 8;

class FrankenFactionSheet {
    constructor(obj) {
        console.log("FrankenFactionSheet.new");

        this._obj = obj;
        this._uiZ = this._obj.getExtent().z + 0.1;

        this._name = this._addName();
        this._abilitiesPanel = this._addAbilitiesPanel();
        this._abilities = [
            this._addAbility(), //
            this._addAbility(),
        ];
        this._commodities = this._addCommodities();
    }

    _save() {
        const json = JSON.stringify({
            name: this._name.getText(),
            // TODO abilities
            // TODO commodities
        });
        if (json.length > 1023) {
            console.log(
                "FrankenFactionSheet._save: data exceeds maximum size, skipping!"
            );
            return;
        }
        this._obj.setSavedData(json);
    }

    setName(value) {
        assert(typeof value === "string");
        this._name.setText(value);
        this._save();
    }

    _addName() {
        const nameText = new Text()
            .setFontSize(7 * UI_SCALE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("FACTION NAME");

        const ui = new UIElement();
        ui.position = new Vector(8.7, 2.1, this._uiZ);
        ui.scale = 1 / UI_SCALE;
        ui.widget = nameText;
        ui.zoomVisibility = UIZoomVisibility.Both;
        this._obj.addUI(ui);

        return nameText;
    }

    _addAbilitiesPanel() {
        const panel = new VerticalBox().setChildDistance(2 * UI_SCALE);

        const ui = new UIElement();
        ui.anchorX = 0;
        ui.anchorY = 0;
        ui.position = new Vector(4.68, 7.69, this._uiZ);
        ui.scale = 1 / UI_SCALE;
        ui.widget = panel;
        ui.zoomVisibility = UIZoomVisibility.Both;
        this._obj.addUI(ui);

        return panel;
    }

    _addAbility() {
        const nameText = new Text()
            .setFontSize(2 * UI_SCALE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("ABILITY NAME");

        const descText = new Text()
            .setFontSize(2 * UI_SCALE)
            .setFont("myriad-pro-semibold.ttf", refPackageId)
            .setText(
                "Ability description test long text wraps correctly in box."
            )
            .setAutoWrap(true);

        const descIndent = new LayoutBox()
            .setPadding(1.7 * UI_SCALE, 0, 0, 0)
            .setOverrideWidth(57 * UI_SCALE)
            .setChild(descText);

        const panel = new VerticalBox().addChild(nameText).addChild(descIndent);

        this._abilitiesPanel.addChild(panel);
        return { nameText, descText };
    }

    _addCommodities() {
        const commoditiesText = new Text()
            .setFontSize(13 * UI_SCALE)
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText("0");

        const ui = new UIElement();
        ui.anchorX = 1;
        ui.position = new Vector(-3.9, 12.7, this._uiZ);
        ui.scale = 1 / UI_SCALE;
        ui.widget = commoditiesText;
        ui.zoomVisibility = UIZoomVisibility.Both;
        this._obj.addUI(ui);

        return commoditiesText;
    }

    _addStartingTech(name) {}
}

refObject.onCreated.add((obj) => {
    new FrankenFactionSheet(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new FrankenFactionSheet(refObject);
}
