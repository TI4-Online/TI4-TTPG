const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const {
    ThrottleClickHandler,
} = require("../../../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../../../lib/ui/widget-factory");
const {
    SCPT_DRAFTS_2024,
} = require("../../../../lib/draft/scpt/scpt-draft-2024.data");
const CONFIG = require("../../../game-ui-config");
const { TextJustification, refPackageId } = require("../../../../wrapper/api");

const SCALE = 1;

class SCPT2024UI {
    constructor(onClickHandlers) {
        assert(onClickHandlers);

        this._onClickHandlers = onClickHandlers;
        this._verticalBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing * SCALE
        );

        this._createDraftSettingsUI();
    }

    getWidget() {
        return this._verticalBox;
    }

    _createDraftSettingsUI() {
        const fontSize = CONFIG.fontSize * SCALE;

        const headerText = "SCPT Patreon Tournament 6";
        const header = WidgetFactory.text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(fontSize)
            .setAutoWrap(true)
            .setJustification(TextJustification.Center)
            .setText(headerText.toUpperCase());

        this._verticalBox.removeAllChildren();
        this._verticalBox.addChild(header);

        for (const draft of SCPT_DRAFTS_2024) {
            const button = WidgetFactory.button()
                .setFontSize(fontSize)
                .setText(draft.name)
                .setEnabled(draft.enabled);
            button.onClicked.add(
                ThrottleClickHandler.wrap((clickedButton, player) => {
                    this._createDraftInProgressUI();
                    this._onClickHandlers.start(draft);
                })
            );
            this._verticalBox.addChild(button);
        }
    }

    _createDraftInProgressUI() {
        const fontSize = CONFIG.fontSize * SCALE;

        const headerText = "SCPT Patreon Tournament 6";
        const header = WidgetFactory.text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(fontSize)
            .setAutoWrap(true)
            .setJustification(TextJustification.Center)
            .setText(headerText.toUpperCase());

        this._verticalBox.removeAllChildren();
        this._verticalBox.addChild(header);

        const cancel = WidgetFactory.button()
            .setFontSize(fontSize)
            .setText(locale("ui.button.cancel"));
        cancel.onClicked.add(
            ThrottleClickHandler.wrap((clickedButton, player) => {
                this._createDraftSettingsUI();
                this._onClickHandlers.cancel(clickedButton, player);
            })
        );
        this._verticalBox.addChild(cancel);
    }
}

module.exports = { SCPT2024UI };
