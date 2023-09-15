const { NavEntry } = require("../../ui/nav/nav-entry");
const { MALTY_DRAFTS } = require("./malty-draft.data");
const CONFIG = require("../../../game-ui/game-ui-config");
const { Border, Button, Text, VerticalBox } = require("../../../wrapper/api");
const { MiltySliceDraft } = require("../milty2/milty-slice-draft");
const { ThrottleClickHandler } = require("../../ui/throttle-click-handler");
const locale = require("../../locale");

class MaltyDraft {
    static createDraftNavEntry() {
        return new NavEntry()
            .setName("maltydraft.com")
            .setIconPath("global/ui/icons/icecream.png")
            .setPersistWidget(true)
            .setWidgetFactory((navPanel, navEntry) => {
                return MaltyDraft.createDraftSettingsWidget();
            });
    }

    static createDraftSettingsWidget() {
        const title = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText("WTF is this?  Ask Brassbird.");
        const spacer = new Border().setColor(CONFIG.spacerColor);
        const scrolling = new VerticalBox().setChildDistance(CONFIG.spacing);
        let sliceDraft = undefined;
        const cancel = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        cancel.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                if (sliceDraft) {
                    sliceDraft.cancel();
                    sliceDraft = undefined;
                }
            })
        );

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(title)
            .addChild(spacer)
            .addChild(scrolling, 1)
            .addChild(cancel);

        for (const maltyDraft of MALTY_DRAFTS) {
            const button = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText(maltyDraft.name);
            scrolling.addChild(button);
            button.onClicked.add(
                ThrottleClickHandler.wrap((button, player) => {
                    const customInput = [
                        `slices=${maltyDraft.slices}`,
                        `labels=${maltyDraft.labels}`,
                        `factions=${maltyDraft.factions}`,
                    ].join("&");
                    sliceDraft = new MiltySliceDraft()
                        .setCustomInput(customInput)
                        .start(player);
                })
            );
        }

        return panel;
    }
}

module.exports = { MaltyDraft };
