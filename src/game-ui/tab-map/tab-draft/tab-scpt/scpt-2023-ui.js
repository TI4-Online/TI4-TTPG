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
const {
    HorizontalAlignment,
    TextJustification,
} = require("../../../../wrapper/api");

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
        label: "2. Draw one secret faction included in all pools.",
    },
    {
        label: "3. Draw one faction into each pool.",
    },
    {
        label: "4. Deal two factions to each player.",
    },
    {
        label: "5. In draft order each player places one of their two factions into a pool, then draws ONE new faction into their hand.",
    },
    {
        label: "6. Continue in draft order until all factions have been placed (do not draw a replacement after the first).",
    },
    {
        label: "7. After building the faction pools, reveal the secret faction.",
    },
    {
        label: "8. Choose a random faction pool, discard the others.",
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
