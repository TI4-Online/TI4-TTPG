const locale = require("../../../../lib/locale");
const { SCPT_DRAFTS } = require("../../../../lib/draft/scpt/scpt-draft.data");
const CONFIG = require("../../../game-ui-config");
const { Button, LayoutBox, VerticalBox } = require("../../../../wrapper/api");

class SCPTDraftSettingsUI extends VerticalBox {
    constructor(onClickHandlers) {
        super();

        this.setChildDistance(CONFIG.spacing);

        for (const draft of SCPT_DRAFTS) {
            const button = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText(draft.name);
            this.addChild(button);
            button.onClicked.add((button, player) => {
                onClickHandlers.start(draft);
            });
        }

        this.addChild(new LayoutBox(), 1); // stretch to fill space

        const button = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        this.addChild(button);
        button.onClicked.add((button, player) => {
            onClickHandlers.cancel();
        });
    }
}

module.exports = { SCPTDraftSettingsUI };
