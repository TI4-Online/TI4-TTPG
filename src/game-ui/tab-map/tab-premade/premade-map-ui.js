const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../game-ui-config");
const MAP_STRING_DB = require("../../../lib/map-string/map-string-db.json");
const {
    Button,
    HorizontalBox,
    LayoutBox,
    Text,
    TextBox,
    VerticalBox,
} = require("../../../wrapper/api");

class PremadeMapUI extends VerticalBox {
    constructor(onClickHandlers, doRefresh) {
        assert(typeof doRefresh === "function");
        super();

        this._onClickHandlers = onClickHandlers;
        this._doRefresh = doRefresh;
        this._scheduleUpdateHandle = undefined;
        this._selectedMapString = undefined;

        this.setChildDistance(CONFIG.spacing);

        const topPanel = new HorizontalBox().setChildDistance(CONFIG.spacing);
        this.addChild(topPanel, 0);
        topPanel.addChild(
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("ui.label.search"))
        );

        this._searchText = new TextBox().setFontSize(CONFIG.fontSize);
        // Changing the UI causes the TextBox to lose focus.
        // this._searchText.onTextChanged.add((textBox, player, text) => {
        //     this.scheduleUpdate();
        // });
        this._searchText.onTextCommitted.add((textBox, player, text) => {
            this.update();
        });
        topPanel.addChild(this._searchText, 1);

        this._choicesBox = new LayoutBox();
        this.addChild(this._choicesBox, 1);

        this.update();
    }

    scheduleUpdate() {
        if (this._scheduleUpdateHandle) {
            clearTimeout(this._scheduleUpdateHandle);
            this._scheduleUpdateHandle = undefined;
        }
        const handler = () => {
            this._scheduleUpdateHandle = undefined;
            this.update();
        };
        this._scheduleUpdateHandle = setTimeout(handler, 100);
    }

    update() {
        const searchParts = this._searchText
            .getText()
            .replace(/,/g, " ")
            .split(" ")
            .map((s) => {
                return s.trim().toLowerCase();
            })
            .filter((s) => {
                return s.length > 0;
            });
        const accept = (candidate) => {
            for (const searchPart of searchParts) {
                if (!candidate._lowerName) {
                    candidate._lowerName = candidate.name.toLowerCase();
                }
                if (!candidate._lowerName.includes(searchPart)) {
                    return false;
                }
            }
            return true;
        };

        const panel = new VerticalBox();
        for (const candidate of MAP_STRING_DB) {
            if (!accept(candidate)) {
                continue;
            }
            const button = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText(candidate.name);
            button.onClicked.add((button, player) => {
                console.log(`PremadeMapUI.onClicked ${candidate.name}`);
                this._onClickHandlers.useMap(candidate);
            });
            panel.addChild(button);
        }
        this._choicesBox.setChild(panel);
        this._doRefresh();
    }
}

module.exports = { PremadeMapUI };
