const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const {
    SCPT_DRAFTS_2022_INVITATIONAL,
} = require("../../../../lib/draft/scpt/scpt-draft-2022-invitational.data");
const CONFIG = require("../../../game-ui-config");
const {
    Border,
    Button,
    HorizontalBox,
    LayoutBox,
    Text,
    VerticalBox,
} = require("../../../../wrapper/api");
const {
    ThrottleClickHandler,
} = require("../../../../lib/ui/throttle-click-handler");

const INSTRUCTIONS = [
    "1. Deal each player two factions.",
    "2. Each player in turn can either veto one of their factions facedown and reveal the other, or veto both facedown.",
    "3. After the last player chooses, draw random factions until there are 7 total factions in the pool.",
    "4. Finally, click to start the draft using the face-up factions.",
].join("\n");

class SCPT2022InvitationalUI extends VerticalBox {
    constructor(onClickHandlers) {
        assert(onClickHandlers);
        assert(onClickHandlers.randomizeTurnOrder);
        assert(onClickHandlers.start);

        super();
        this._onClickHandlers = onClickHandlers;

        this.setChildDistance(CONFIG.spacing);

        this._createDraftSettingsUI();
    }

    _createDraftSettingsUI() {
        this.removeAllChildren();

        const instructions = new Text()
            .setAutoWrap(true)
            .setFontSize(CONFIG.fontSize * 0.7)
            .setText(INSTRUCTIONS);

        const randomizeTurnOrderButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText("Randomize\nturn order");
        randomizeTurnOrderButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                this._onClickHandlers.randomizeTurnOrder();
            })
        );

        const setupRight = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(randomizeTurnOrderButton, 1);

        const setupPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(instructions, 3)
            .addChild(setupRight, 1);
        const paddedSetupPanel = new LayoutBox()
            .setPadding(
                CONFIG.spacing,
                CONFIG.spacing,
                CONFIG.spacing,
                CONFIG.spacing
            )
            .setChild(setupPanel);
        const borderSetupPanel = new Border()
            .setColor([0, 0.12, 1])
            .setChild(paddedSetupPanel);
        this.addChild(borderSetupPanel);

        for (const draft of SCPT_DRAFTS_2022_INVITATIONAL) {
            const button = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText(draft.name);
            this.addChild(button);
            button.onClicked.add(
                ThrottleClickHandler.wrap((button, player) => {
                    this._onClickHandlers.start(draft);
                    this._createDraftInProgressUI();
                })
            );
        }
    }

    _createDraftInProgressUI() {
        this.removeAllChildren();

        const onCancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                this._onClickHandlers.cancel(player);
                this._createDraftSettingsUI();
            })
        );

        const draftInProgress = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.in_progress"));
        this.addChild(draftInProgress);

        this.addChild(new LayoutBox(), 1);

        this.addChild(onCancelButton);
    }

    createSimpleButton(draft) {}
}

module.exports = { SCPT2022InvitationalUI };
