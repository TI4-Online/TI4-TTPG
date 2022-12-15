const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const {
    ThrottleClickHandler,
} = require("../../../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../../../lib/ui/widget-factory");
const {
    SCPT_DRAFTS_2023,
} = require("../../../../lib/draft/scpt/scpt-draft-2023.data");
const CONFIG = require("../../../game-ui-config");
const { TextJustification } = require("../../../../wrapper/api");

const STEPS = [
    {
        label: "0. Remove two Keleres cards, can swap flavors after draft before unpacking.",
        onClicked: "removeTwoKeleres",
    },
    {
        label: "1. Create four faction pool areas, randomize draft order.",
        onClicked: "createFactionPools",
    },
    {
        label: "2. Draw one shared face-down faction to the center, keep it face-down.",
    },
    {
        label: "3. Draw one face-up faction into each pool.",
    },
    {
        label: "4. Deal two factions to each player.",
    },
    {
        label: "5. In draft order (not snake) each player places one of their two factions face-up into a pool, then draws one new faction into their hand.",
    },
    {
        label: "6. Continue in draft order (not snake) until all factions have been placed.  Do not draw more replacement factions.",
    },
    {
        label: "7. After building the faction pools, reveal the center face-down faction.",
    },
    {
        label: "8. Choose a random faction pool keeping the center faction, discard the other pools.",
        onClicked: "chooseFactionPool",
    },
    {
        label: "9. Proceed to a Milty Draft with these factions.  Use slices for:",
    },
];

const SCALE = 0.7;

class SCPT2023UI {
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
        for (const step of STEPS) {
            let widget;
            if (step.onClicked) {
                assert(typeof step.onClicked === "string");
                widget = WidgetFactory.button()
                    .setFontSize(fontSize)
                    .setText(step.label);

                widget.onClicked.add(
                    ThrottleClickHandler.wrap((clickedButton, player) => {
                        this._onClickHandlers[step.onClicked](
                            clickedButton,
                            player
                        );
                    })
                );
            } else {
                widget = WidgetFactory.text()
                    .setFontSize(fontSize)
                    .setAutoWrap(true)
                    .setJustification(TextJustification.Center)
                    .setText(step.label);
            }
            this._verticalBox.addChild(widget);
        }

        const miltyPanel = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing * SCALE
        );
        for (const draft of SCPT_DRAFTS_2023) {
            const button = WidgetFactory.button()
                .setFontSize(fontSize)
                .setText(draft.name)
                .setEnabled(draft.enabled);
            button.onClicked.add(
                ThrottleClickHandler.wrap((clickedButton, player) => {
                    this._onClickHandlers.start(draft);
                })
            );
            miltyPanel.addChild(button, 1);
        }
        const cancel = WidgetFactory.button()
            .setFontSize(fontSize)
            .setText(locale("ui.button.cancel"));
        cancel.onClicked.add(
            ThrottleClickHandler.wrap((clickedButton, player) => {
                this._onClickHandlers.cancel(clickedButton, player);
            })
        );
        miltyPanel.addChild(cancel, 1);
        this._verticalBox.addChild(miltyPanel, 1);
    }
}

module.exports = { SCPT2023UI };
