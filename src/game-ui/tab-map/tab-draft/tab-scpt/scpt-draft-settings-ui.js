const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const { SCPT_DRAFTS } = require("../../../../lib/draft/scpt/scpt-draft.data");
const CONFIG = require("../../../game-ui-config");
const {
    Button,
    HorizontalBox,
    LayoutBox,
    Text,
    VerticalBox,
} = require("../../../../wrapper/api");

class SCPTDraftSettingsUI extends VerticalBox {
    constructor(onClickHandlers) {
        assert(onClickHandlers);
        super();
        this._onClickHandlers = onClickHandlers;

        this.setChildDistance(CONFIG.spacing);

        for (const draft of SCPT_DRAFTS) {
            if (draft.chooseFactionSet) {
                this.createChooseFaction(draft);
            } else {
                this.createSimpleButton(draft);
            }
        }

        this.addChild(new LayoutBox(), 1); // stretch to fill space

        const button = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        this.addChild(button);
        button.onClicked.add((button, player) => {
            this._onClickHandlers.cancel();
        });
    }

    createSimpleButton(draft) {
        const button = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(draft.name);
        this.addChild(button);
        button.onClicked.add((button, player) => {
            this._onClickHandlers.start(draft);
        });
    }

    createChooseFaction(draft) {
        const panel = new HorizontalBox().setChildDistance(CONFIG.spacing);
        this.addChild(panel);

        const label = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(draft.name + ":");
        panel.addChild(label, 0);

        for (let i = 0; i < draft.factionSets.length; i++) {
            const button = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText(`${i + 1}`);
            panel.addChild(button, 1);
            button.onClicked.add((button, player) => {
                console.log(`createChooseFaction: ${i}`);
                this._onClickHandlers.start(draft, i);
            });
        }
    }
}

module.exports = { SCPTDraftSettingsUI };
