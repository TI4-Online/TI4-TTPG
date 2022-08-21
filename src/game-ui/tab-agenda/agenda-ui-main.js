const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { AgendaWidgetSummary } = require("./agenda-widget-summary");
const {
    Button,
    HorizontalAlignment,
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
    refPackageId,
} = require("../../wrapper/api");

class AgendaUiMain extends LayoutBox {
    static simpleNoMechy(text) {
        assert(typeof text === "string");

        const textWidget = AgendaUiMain.createMainText(text);

        const abstract = new AgendaUiMain();
        abstract.setChild(textWidget);
        return abstract;
    }

    static simple(text) {
        assert(typeof text === "string");

        const textWidget = AgendaUiMain.createMainText(text);

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(textWidget, 1)
            .addChild(AgendaUiMain.createMechy(), 0);

        const abstract = new AgendaUiMain();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleYesNo(text, yesHandler, noHandler) {
        assert(typeof text === "string");
        assert(typeof yesHandler === "function");
        assert(typeof noHandler === "function");

        const leftPanel = AgendaUiMain.createLeftPanel()
            .addChild(AgendaUiMain.createMainText(text))
            .addChild(AgendaUiMain.createYesNo(yesHandler, noHandler));

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(AgendaUiMain.createMechy(), 0);

        const abstract = new AgendaUiMain();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleWaiting(text) {
        assert(typeof text === "string");

        const leftPanel = AgendaUiMain.createLeftPanel()
            .addChild(AgendaUiMain.createMainText(text))
            .addChild(AgendaUiMain.createWaitingFor());

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(AgendaUiMain.createMechy(), 0);

        const abstract = new AgendaUiMain();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleButton(text, buttonText, buttonHandler) {
        assert(typeof text === "string");
        assert(typeof buttonText === "string");
        assert(typeof buttonHandler === "function");

        const leftPanel = AgendaUiMain.createLeftPanel()
            .addChild(AgendaUiMain.createMainText(text))
            .addChild(AgendaUiMain.createButton(buttonText, buttonHandler));

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(AgendaUiMain.createMechy(), 0);

        const abstract = new AgendaUiMain();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleButtonList(text, buttonTextsAndOnClicks) {
        assert(typeof text === "string");
        assert(Array.isArray(buttonTextsAndOnClicks));

        const leftPanel = AgendaUiMain.createLeftPanel()
            .setChildDistance(CONFIG.spacing)
            .addChild(AgendaUiMain.createMainText(text));
        buttonTextsAndOnClicks.forEach((buttonTextAndOnClick) => {
            assert(typeof buttonTextAndOnClick.text === "string");
            assert(typeof buttonTextAndOnClick.onClick === "function");
            const button = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText(buttonTextAndOnClick.text);
            button.onClicked.add(buttonTextAndOnClick.onClick);
            leftPanel.addChild(button);
        });

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(AgendaUiMain.createMechy(), 0);

        const abstract = new AgendaUiMain();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleWithState(text) {
        assert(typeof text === "string");

        const summary = new AgendaWidgetSummary();
        const summaryBox = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(summary);

        return summaryBox;
    }

    constructor() {
        super();

        this.setVerticalAlignment(VerticalAlignment.Center);
    }

    static createLeftPanel() {
        return new VerticalBox().setChildDistance(
            CONFIG.spacing + CONFIG.fontSize
        );
    }

    static createMainText(text) {
        assert(typeof text === "string");
        return new Text()
            .setText(text)
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);
    }

    static createYesNo(yesHandler, noHandler) {
        assert(typeof yesHandler === "function");
        assert(typeof noHandler === "function");
        const yesButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.yes"));
        yesButton.onClicked.add(yesHandler);
        const noButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.no"));
        noButton.onClicked.add(noHandler);
        return new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(yesButton, 1)
            .addChild(noButton, 1);
    }

    static createButton(buttonText, buttonHandler) {
        assert(typeof buttonText === "string");
        assert(typeof buttonHandler === "function");
        const button = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(buttonText);
        button.onClicked.add(buttonHandler);
        return button;
    }

    static createMechy() {
        const img = new ImageWidget()
            .setImage("global/ui/mechy.png", refPackageId)
            .setImageSize(256 * CONFIG.scale, 256 * CONFIG.scale);
        return new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(img);
    }
}

module.exports = { AgendaUiMain };
