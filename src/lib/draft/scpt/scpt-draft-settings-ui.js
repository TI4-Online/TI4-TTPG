const locale = require("../../locale");
const { SCPT_DRAFTS } = require("./scpt-draft.data");
const { Button, VerticalBox } = require("../../../wrapper/api");

class SCPTDraftSettings extends VerticalBox {
    constructor(onClickHandlers) {
        super();

        for (const draft of SCPT_DRAFTS) {
            const button = new Button().setText(draft.name);
            this.addChild(button);
            button.onClicked.add((button, player) => {
                onClickHandlers.start(draft);
            });
        }
        const button = new Button().setText(locale("ui.button.cancel"));
        this.addChild(button);
        button.onClicked.add((button, player) => {
            onClickHandlers.cancel();
        });
    }
}

module.exports = { SCPTDraftSettings };
