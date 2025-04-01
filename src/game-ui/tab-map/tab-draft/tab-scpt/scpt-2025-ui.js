const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const {
    ThrottleClickHandler,
} = require("../../../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../../../lib/ui/widget-factory");
const {
    SCPT_DRAFTS_2025,
} = require("../../../../lib/draft/scpt/scpt-draft-2025.data");
const CONFIG = require("../../../game-ui-config");
const { TextJustification, refPackageId } = require("../../../../wrapper/api");

const SCALE = 1;

class SCPT2025UI {
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

        const headerText = "SCPT Patreon Tournament 7";
        const header = WidgetFactory.text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(fontSize)
            .setAutoWrap(true)
            .setJustification(TextJustification.Center)
            .setText(headerText.toUpperCase());

        this._verticalBox.removeAllChildren();
        this._verticalBox.addChild(header);

        for (const draft of SCPT_DRAFTS_2025) {
            if (draft.name === "Semi-finals") {
                const semis1 = WidgetFactory.button()
                    .setFontSize(fontSize)
                    .setText("Semis 1");
                semis1.onClicked.add(
                    ThrottleClickHandler.wrap((clickedButton, player) => {
                        this._createDraftInProgressUI();
                        this._onClickHandlers.start(draft.semis1);
                    })
                );
                const semis2 = WidgetFactory.button()
                    .setFontSize(fontSize)
                    .setText("Semis 2");
                semis2.onClicked.add(
                    ThrottleClickHandler.wrap((clickedButton, player) => {
                        this._createDraftInProgressUI();
                        this._onClickHandlers.start(draft.semis2);
                    })
                );
                const semis3 = WidgetFactory.button()
                    .setFontSize(fontSize)
                    .setText("Semis 3");
                semis3.onClicked.add(
                    ThrottleClickHandler.wrap((clickedButton, player) => {
                        this._createDraftInProgressUI();
                        this._onClickHandlers.start(draft.semis3);
                    })
                );
                const semis4 = WidgetFactory.button()
                    .setFontSize(fontSize)
                    .setText("Semis 4");
                semis4.onClicked.add(
                    ThrottleClickHandler.wrap((clickedButton, player) => {
                        this._createDraftInProgressUI();
                        this._onClickHandlers.start(draft.semis4);
                    })
                );
                const semis5 = WidgetFactory.button()
                    .setFontSize(fontSize)
                    .setText("Semis 5");
                semis5.onClicked.add(
                    ThrottleClickHandler.wrap((clickedButton, player) => {
                        this._createDraftInProgressUI();
                        this._onClickHandlers.start(draft.semis5);
                    })
                );
                const semis6 = WidgetFactory.button()
                    .setFontSize(fontSize)
                    .setText("Semis 6");
                semis6.onClicked.add(
                    ThrottleClickHandler.wrap((clickedButton, player) => {
                        this._createDraftInProgressUI();
                        this._onClickHandlers.start(draft.semis6);
                    })
                );

                const panel = WidgetFactory.horizontalBox()
                    .setChildDistance(CONFIG.spacing)
                    .addChild(semis1, 1)
                    .addChild(semis2, 1)
                    .addChild(semis3, 1)
                    .addChild(semis4, 1)
                    .addChild(semis5, 1)
                    .addChild(semis6, 1);
                this._verticalBox.addChild(panel);
            } else {
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
    }

    _createDraftInProgressUI() {
        const fontSize = CONFIG.fontSize * SCALE;

        const headerText = "SCPT Patreon Tournament 7";
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

module.exports = { SCPT2025UI };
