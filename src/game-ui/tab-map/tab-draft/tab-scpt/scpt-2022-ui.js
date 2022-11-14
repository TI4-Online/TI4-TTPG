const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const {
    SCPT_DRAFTS_2022,
} = require("../../../../lib/draft/scpt/scpt-draft-2022.data");
const CONFIG = require("../../../game-ui-config");
const {
    Button,
    HorizontalBox,
    LayoutBox,
    Text,
    VerticalBox,
} = require("../../../../wrapper/api");

class SCPT2022UI extends VerticalBox {
    constructor(onClickHandlers) {
        assert(onClickHandlers);
        super();
        this._onClickHandlers = onClickHandlers;

        this.setChildDistance(CONFIG.spacing);

        this._createDraftSettingsUI();
    }

    _createDraftSettingsUI() {
        this.removeAllChildren();

        for (const draft of SCPT_DRAFTS_2022) {
            if (draft.chooseFactionSet) {
                this.createChooseFaction(draft);
            } else {
                this.createSimpleButton(draft);
            }
        }
    }

    _createDraftInProgressUI() {
        this.removeAllChildren();

        const onCancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            this._onClickHandlers.cancel(player);
            this._createDraftSettingsUI();
        });

        const draftInProgress = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.in_progress"));
        this.addChild(draftInProgress);

        this.addChild(new LayoutBox(), 1);

        this.addChild(onCancelButton);
    }

    createSimpleButton(draft) {
        const button = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(draft.name);
        this.addChild(button);
        button.onClicked.add((button, player) => {
            this._onClickHandlers.start(draft);
            this._createDraftInProgressUI();
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
                this._createDraftInProgressUI();
            });
        }
    }
}

module.exports = { SCPT2022UI };
