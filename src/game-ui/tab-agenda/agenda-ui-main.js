const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    Button,
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
    UIElement,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

// These objects may come and go.  Register a single listener and propagate events.
let _agendaUiMain = false;
const onTurnChangedProxy = (currentDesk, previousDesk, player) => {
    if (_agendaUiMain) {
        _agendaUiMain.update();
    }
};
globalEvents.TI4.onTurnChanged.add(onTurnChangedProxy);

class AgendaUiMain extends LayoutBox {
    static simpleNoMechy(text) {
        assert(typeof text === "string");
        const abstract = new AgendaUiMain();

        const textWidget = abstract.createMainText(text);

        abstract.update();
        abstract.setChild(textWidget);
        return abstract;
    }

    static simple(text) {
        assert(typeof text === "string");
        const abstract = new AgendaUiMain();

        const textWidget = abstract.createMainText(text);

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(textWidget, 1)
            .addChild(abstract.createMechy(), 0);

        abstract.update();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleYesNo(text, yesHandler, noHandler) {
        assert(typeof text === "string");
        assert(typeof yesHandler === "function");
        assert(typeof noHandler === "function");
        const abstract = new AgendaUiMain();

        const leftPanel = abstract
            .createLeftPanel()
            .addChild(abstract.createMainText(text))
            .addChild(abstract.createYesNo(yesHandler, noHandler));

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(abstract.createMechy(), 0);

        abstract.update();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleWaiting(text) {
        assert(typeof text === "string");
        const abstract = new AgendaUiMain();

        const leftPanel = abstract
            .createLeftPanel()
            .addChild(abstract.createMainText(text))
            .addChild(abstract.createWaitingFor());

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(abstract.createMechy(), 0);

        abstract.update();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleNext(text, nextHandler) {
        assert(typeof text === "string");
        assert(typeof nextHandler === "function");
        const abstract = new AgendaUiMain();

        const leftPanel = abstract
            .createLeftPanel()
            .addChild(abstract.createMainText(text))
            .addChild(abstract.createNext(nextHandler));

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(abstract.createMechy(), 0);

        abstract.update();
        abstract.setChild(panel);
        return abstract;
    }

    static simpleButtonList(text, buttonTextsAndOnClicks) {
        assert(typeof text === "string");
        assert(Array.isArray(buttonTextsAndOnClicks));
        const abstract = new AgendaUiMain();

        const leftPanel = abstract
            .createLeftPanel()
            .setChildDistance(CONFIG.spacing)
            .addChild(abstract.createMainText(text));
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
            .addChild(abstract.createMechy(), 0);

        abstract.update();
        abstract.setChild(panel);
        return abstract;
    }

    constructor() {
        super();
        this._waitingFor = undefined;
        this.setVerticalAlignment(VerticalAlignment.Center);
        _agendaUiMain = this;
    }

    createLeftPanel() {
        return new VerticalBox().setChildDistance(
            CONFIG.spacing + CONFIG.fontSize
        );
    }

    createMainText(text) {
        assert(typeof text === "string");
        return new Text()
            .setText(text)
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);
    }

    createWaitingFor() {
        assert(!this._waitingFor);
        this._waitingFor = new Text()
            .setText(locale("ui.agenda.clippy.waiting_for_player_name"))
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);
        return this._waitingFor;
    }

    createYesNo(yesHandler, noHandler) {
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

    createNext(nextHandler) {
        assert(typeof nextHandler === "function");
        const nextButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.next"));
        nextButton.onClicked.add(nextHandler);
        return nextButton;
    }

    createMechy() {
        return new ImageWidget()
            .setImage("global/ui/mechy.png", refPackageId)
            .setImageSize(256, 256);
    }

    setUIElement(uiElement) {
        assert(uiElement instanceof UIElement);
        this._uiElement = uiElement;
    }

    update() {
        const playerName = world.TI4.turns.getCurrentTurn().colorName;
        if (this._waitingFor) {
            this._waitingFor.setText(
                locale("ui.agenda.clippy.waiting_for_player_name", {
                    playerName,
                })
            );
        }
        if (this._uiElement) {
            world.updateUI(this._uiElement);
        }
    }
}

module.exports = { AgendaUiMain };
