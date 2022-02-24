const locale = require("../../lib/locale");
const {
    Button,
    HorizontalBox,
    ImageWidget,
    Text,
    VerticalBox,
} = require("../../wrapper/api");

class TabActionUI extends HorizontalBox {
    constructor() {
        super();

        this.addChild(this.buildLeftPanel(), 0);
        this.addChild(this.buildRightPanel(), 1);
    }

    buildLeftPanel() {
        const panel = new VerticalBox();

        panel.addChild(
            new Text().setText(locale("ui.phase.action.activation"))
        );
        panel.addChild(new Text().setText(locale("ui.phase.action.movement")));
        panel.addChild(
            new Button().setText(
                locale("ui.phase.action.space_cannon_offsense")
            )
        );
        panel.addChild(
            new Button().setText(locale("ui.phase.action.anti_fighter_barrage"))
        );
        panel.addChild(
            new Text().setText(locale("ui.phase.action.announce_retreat"))
        );
        panel.addChild(
            new Button().setText(locale("ui.phase.action.space_combat"))
        );
        panel.addChild(new Text().setText(locale("ui.phase.action.retreat")));
        panel.addChild(
            new Text().setText(locale("ui.phase.action.bombardment"))
        );
        panel.addChild(this.buildPerPlanet());
        panel.addChild(
            new Text().setText(locale("ui.phase.action.space_cannon_defense"))
        );
        panel.addChild(this.buildPerPlanet());
        panel.addChild(
            new Text().setText(locale("ui.phase.action.ground_combat"))
        );
        panel.addChild(this.buildPerPlanet());
        panel.addChild(new Text().setText(locale("ui.phase.action.explore")));
        panel.addChild(this.buildPerPlanet());
        panel.addChild(
            new Text().setText(locale("ui.phase.action.production"))
        );

        return panel;
    }

    buildPerPlanet() {
        const panel = new HorizontalBox();
        panel.addChild(new Button().setText("Abyz"));
        panel.addChild(new Button().setText("Fria"));
        return panel;
    }

    buildRightPanel() {
        const panel = new VerticalBox();

        panel.addChild(
            new ImageWidget()
                .setImage("locale/tiles/base/regular/tile_030.jpg")
                .setImageSize(400, 400)
        );

        return panel;
    }
}

module.exports = { TabActionUI };
