const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { CardUtil } = require("../../lib/card/card-util");
const {
    Button,
    GameObject,
    ImageButton,
    UIElement,
    Vector,
    VerticalBox,
    globalEvents,
    refObject,
    refPackageId,
    world,
} = require("../../wrapper/api");
const { Border } = require("@tabletop-playground/api");

// Fetch cards
class PlanetMat {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._actionNameToPlanet = {};
        this._popupUI = new UIElement();

        const button = new ImageButton()
            .setImage("global/ui/menu_button_hex.png", refPackageId)
            .setImageSize(150, 150);
        button.onClicked.add((button, player) => {
            this.closePopupMenu();
            this.createPopupMenu();
        });

        // Mallice needs to be flipped to see button, that's ok.
        const ui = new UIElement();
        ui.widget = button;
        ui.position = new Vector(13.5, 0, 0.26);
        ui.scale = 0.1;
        this._obj.addUI(ui);

        this._popupUI.position = new Vector(13.5, 0, 1);
        this._popupUI.widget = new Border();

        globalEvents.TI4.onSystemActivated.add((systemTileObj, player) => {
            this.clearActionMenu();
            this.createActionMenu(systemTileObj);
        });

        this._obj.onCustomAction.add((obj, player, actionName) => {
            const planet = this._actionNameToPlanet[actionName];
            this.fetch(planet);
        });
    }

    clearActionMenu() {
        for (const actionName of Object.keys(this._actionNameToPlanet)) {
            this._obj.removeCustomAction(actionName);
        }
        this._actionNameToPlanet = {};
    }

    createActionMenu(systemTileObj) {
        const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        if (!system) {
            console.log("PlanetMat.createActionMenu: no system");
            return;
        }

        for (const planet of system.planets) {
            const planetName = planet.getNameStr();
            const actionName = locale("ui.menu.fetch_planet", {
                planetName,
            });
            this._actionNameToPlanet[actionName] = planet;
            this._obj.addCustomAction(actionName);
        }
    }

    closePopupMenu() {
        this._obj.removeUIElement(this._popupUI);
    }

    createPopupMenu() {
        console.log("PlanetMat.createPopupMenu()");
        const panel = new VerticalBox();
        for (const [actionName, planet] of Object.entries(
            this._actionNameToPlanet
        )) {
            const button = new Button().setText(actionName);
            button.onClicked.add((button, player) => {
                this.closePopupMenu();
                this.fetch(planet);
            });
            panel.addChild(button);
        }
        const button = new Button().setText(locale("ui.button.cancel"));
        button.onClicked.add((button, player) => {
            this.closePopupMenu();
        });
        panel.addChild(button);

        this._popupUI.widget.setChild(panel);
        this._obj.addUI(this._popupUI);
    }

    fetch(planet) {
        console.log(`PlanetMat.fetch(${planet.getNameStr()})`);

        const nsidSet = new Set();
        nsidSet.add(planet.getPlanetCardNsid());
        if (planet.raw.legendary) {
            nsidSet.add(planet.raw.legendaryCard);
        }
        for (const x of nsidSet) {
            console.log(`XXX ${x}`);
        }

        const cards = CardUtil.gatherCards((nsid) => {
            return nsidSet.has(nsid);
        });

        const pos = this._obj.getPosition().add([0, 0, 10]);
        const rot = this._obj.getRotation();
        for (const card of cards) {
            card.setPosition(pos, 1);
            card.setRotation(rot, 1);
        }
    }
}

refObject.onCreated.add((obj) => {
    new PlanetMat(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new PlanetMat(refObject);
}
