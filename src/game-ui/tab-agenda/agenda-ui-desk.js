const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { AgendaCardWidget } = require("../../lib/agenda/agenda-card-widget");
const {
    AgendaWidgetAvailableVotes,
} = require("./agenda-widget-available-votes");
const { Broadcast } = require("../../lib/broadcast");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const {
    ContentButton,
    HorizontalAlignment,
    ImageButton,
    LayoutBox,
    TextJustification,
    VerticalAlignment,
    world,
} = require("../../wrapper/api");
const { CollapsiblePanel } = require("../../lib/ui/collapsible-panel");

const ANYONE_CAN_CLICK = false;
const BUTTON_SCALE = 0.75;

/**
 * Per-desk: whens, afters, outcomes
 */
class AgendaUiDesk {
    constructor(playerDesk, outcomeNamesMutable, callbacks) {
        assert(playerDesk);
        assert(typeof outcomeNamesMutable === "boolean");
        assert(callbacks);

        assert(typeof callbacks.onNoWhens === "function");
        assert(typeof callbacks.onPlayWhen === "function");
        assert(typeof callbacks.onNoAfters === "function");
        assert(typeof callbacks.onPlayAfter === "function");
        assert(typeof callbacks.onLockWhensAfters === "function");
        assert(typeof callbacks.onOutcomeEdit === "function");
        assert(typeof callbacks.onVoteOutcome === "function");
        assert(typeof callbacks.onVoteIncr === "function");
        assert(typeof callbacks.onVoteDecr === "function");
        assert(typeof callbacks.onVoteLocked === "function");
        assert(typeof callbacks.onPredictIncr === "function");
        assert(typeof callbacks.onPredictDecr === "function");

        this._playerDesk = playerDesk;
        this._outcomeNamesMutable = outcomeNamesMutable;
        this._callbacks = callbacks;

        this._agendaCard = world.TI4.agenda.getAgendaCard();

        this._voteWidget = this._createVoteWidget();
        this._zoomedAgendaCardWidget = this._createZoomedAgendaCardWidget();

        this._box = new LayoutBox().setChild(this._voteWidget);
        this._collapsiblePanel = new CollapsiblePanel()
            .setChild(this._box)
            .setClosable(false)
            .setColor(CONFIG.backgroundColor)
            .setPlayerDeskIndex(this._playerDesk.index)
            .setScale(CONFIG.scale)
            .setTitle(locale("ui.phase.agenda.label"));
    }

    _showVoteWidget() {
        if (!this._box) {
            return; // race with destroy
        }
        this._box.setChild(this._voteWidget);
    }
    _showZoomedAgendaCardWidget() {
        if (!this._box) {
            return; // race with destroy
        }
        this._box.setChild(this._zoomedAgendaCardWidget);
    }

    _createVoteWidget() {
        const panel = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        panel.addChild(
            new AgendaWidgetAvailableVotes(
                CONFIG.fontSize,
                this._playerDesk.index
            ).getWidget()
        );
        panel.addChild(WidgetFactory.border().setColor(CONFIG.spacerColor));

        const midPanel = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing
        );
        midPanel.addChild(this._createAgendaCardWidget());
        const midRight = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        midRight.addChild(this._createWhensWidget());
        midRight.addChild(this._createAftersWidget());
        midRight.addChild(this._createLockWhensAftersWidget());
        midPanel.addChild(midRight);
        const midBox = WidgetFactory.layoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(midPanel);
        panel.addChild(midBox);

        panel.addChild(this._createOutcomesWidget(this._outcomeNamesMutable));
        panel.addChild(this._createLockWidget());
        panel.addChild(WidgetFactory.border().setColor(CONFIG.spacerColor));
        panel.addChild(this._createWaitingForWidget());

        return panel;
    }

    _createAgendaCardWidget() {
        const box = WidgetFactory.layoutBox().setVerticalAlignment(
            VerticalAlignment.Center
        );
        const card = world.TI4.agenda.getAgendaCard();
        if (card) {
            const button = AgendaCardWidget.getImageButton(card);
            const width = Math.floor(90 * CONFIG.scale); // 48 fits with two rows of buttons, have more now
            const height = Math.floor((width * 750) / 500);
            if (button instanceof ImageButton) {
                button.setImageSize(width, height);
            } else if (button instanceof ContentButton) {
                button.getChild().setImageSize(width, height);
            }
            box.setChild(button);

            button.onClicked.add(
                ThrottleClickHandler.wrap((clickedButton, player) => {
                    this._showZoomedAgendaCardWidget();
                })
            );
        }
        return box;
    }

    _createZoomedAgendaCardWidget() {
        const clickHandler = ThrottleClickHandler.wrap(
            (clickedButton, player) => {
                this._showVoteWidget();
            }
        );

        // This "can't happen" but might in some unittest cases.
        // If it *does* happen do something reasonable.
        if (!this._agendaCard) {
            const button = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize)
                .setText("???");
            button.onClicked.add(clickHandler);
            return button;
        }

        const scale = 2;
        const width = 330 * scale;
        const height = (width * 750) / 500;
        const zoomedCard = AgendaCardWidget.getImageButton(this._agendaCard);

        if (zoomedCard instanceof ImageButton) {
            zoomedCard.setImageSize(width, height);
        } else if (zoomedCard instanceof ContentButton) {
            zoomedCard.getChild().setImageSize(width, height);
        }

        zoomedCard.onClicked.add(clickHandler);

        return zoomedCard;
    }

    attach() {
        // Add several UI items: from back to front expand button, main UI, and zoomed card.
        // Instead of adding/removing, just hide the items.
        this._collapsiblePanel.createAndAddUi();
        return this;
    }

    detach() {
        this._collapsiblePanel.close();
        return this;
    }

    allowClick(player) {
        if (
            ANYONE_CAN_CLICK ||
            this._playerDesk.playerSlot === player.getSlot()
        ) {
            return true;
        }
        const playerName = world.TI4.getNameByPlayerSlot(player.getSlot());
        const msg = locale("ui.error.not_owner", { playerName });
        Broadcast.broadcastOne(player, msg);
    }

    _createWhensWidget() {
        this._noWhensButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.no_whens"));
        this._playWhenButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.play_when"));

        this._noWhensButton.onClicked.add(
            ThrottleClickHandler.wrap((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onNoWhens(this._playerDesk, player);
            })
        );
        this._playWhenButton.onClicked.add(
            ThrottleClickHandler.wrap((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onPlayWhen(this._playerDesk, player);
            })
        );

        const panel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._noWhensButton, 1)
            .addChild(this._playWhenButton, 1);
        return panel;
    }

    _createAftersWidget() {
        this._noAftersButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.no_afters"));
        this._playAfterButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.play_after"));

        this._noAftersButton.onClicked.add(
            ThrottleClickHandler.wrap((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onNoAfters(this._playerDesk, player);
            })
        );
        this._playAfterButton.onClicked.add(
            ThrottleClickHandler.wrap((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onPlayAfter(this._playerDesk, player);
            })
        );

        const panel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._noAftersButton, 1)
            .addChild(this._playAfterButton, 1);
        return panel;
    }

    _createLockWhensAftersWidget() {
        this._lockWhensAftersButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.lock_no_whens_afters"));

        this._lockWhensAftersButton.onClicked.add(
            ThrottleClickHandler.wrap((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onLockWhensAfters(this._playerDesk, player);
            })
        );

        return this._lockWhensAftersButton;
    }

    _createOutcomesWidget(outcomeNamesMutable) {
        assert(typeof outcomeNamesMutable === "boolean");

        this._outcomeData = [];

        const colName = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        const colVotes = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        const colPredictions = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        colName.addChild(
            WidgetFactory.text()
                .setFontSize(CONFIG.fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.outcomes"))
        );
        colVotes.addChild(
            WidgetFactory.text()
                .setFontSize(CONFIG.fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.votes"))
        );
        colPredictions.addChild(
            WidgetFactory.text()
                .setFontSize(CONFIG.fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.predictions"))
        );

        const agenda = world.TI4.agenda;
        for (
            let outcomeIndex = 0;
            outcomeIndex < agenda.getNumOutcomes();
            outcomeIndex++
        ) {
            const outcomeName = agenda.getOutcomeName(outcomeIndex);
            const nameText = outcomeNamesMutable
                ? WidgetFactory.textBox()
                : WidgetFactory.text();
            nameText.setFontSize(CONFIG.fontSize).setText(outcomeName);
            if (outcomeNamesMutable) {
                let lazyUpdateTimeoutHandle = undefined;
                const lazyUpdate = () => {
                    lazyUpdateTimeoutHandle = undefined;
                    const value = nameText.getText();
                    agenda.setOutcomeName(outcomeIndex, value);
                };
                // Updating text on one propogates to peers.  Player is undefined for setText.
                nameText.onTextChanged.add((textBox, player, value) => {
                    if (player) {
                        if (lazyUpdateTimeoutHandle) {
                            clearTimeout(lazyUpdateTimeoutHandle);
                        }
                        lazyUpdateTimeoutHandle = setTimeout(lazyUpdate, 50);
                    }
                });
            }
            colName.addChild(nameText);

            const voteButton = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText(locale("ui.agenda.clippy.vote"));
            const voteDecrButton = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("-")
                .setEnabled(false);
            const voteIncrButton = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("+")
                .setEnabled(false);
            const voteText = WidgetFactory.richText()
                .setFontSize(CONFIG.fontSize)
                .setText(" [0] ");

            voteButton.onClicked.add(
                ThrottleClickHandler.wrap((clickedButton, player) => {
                    if (!this.allowClick(player)) {
                        return;
                    }
                    this._callbacks.onVoteOutcome(
                        this._playerDesk,
                        outcomeIndex,
                        player
                    );
                })
            );
            voteDecrButton.onClicked.add((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onVoteDecr(this._playerDesk, player);
            });
            voteIncrButton.onClicked.add((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onVoteIncr(this._playerDesk, player);
            });

            const votePanel = WidgetFactory.horizontalBox()
                .addChild(voteButton)
                .addChild(voteDecrButton)
                .addChild(voteIncrButton)
                .addChild(voteText);
            colVotes.addChild(votePanel);

            const predictionDecrButton = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("-");
            const predictionIncrButton = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("+");
            const predictionText = WidgetFactory.richText().setFontSize(
                CONFIG.fontSize
            );

            predictionDecrButton.onClicked.add((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onPredictDecr(
                    this._playerDesk,
                    outcomeIndex,
                    player
                );
            });
            predictionIncrButton.onClicked.add((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onPredictIncr(
                    this._playerDesk,
                    outcomeIndex,
                    player
                );
            });

            const predictionPanel = WidgetFactory.horizontalBox()
                .addChild(predictionDecrButton)
                .addChild(predictionIncrButton)
                .addChild(predictionText);
            colPredictions.addChild(predictionPanel);

            this._outcomeData.push({
                nameText,
                voteButton,
                voteDecrButton,
                voteIncrButton,
                voteText,
                predictionDecrButton,
                predictionIncrButton,
                predictionText,
            });
        }

        return WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing * 3)
            .addChild(colName)
            .addChild(colVotes)
            .addChild(colPredictions);
    }

    _createLockWidget() {
        this._lockVoteButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.lock_vote"));
        this._lockVoteButton.onClicked.add(
            ThrottleClickHandler.wrap((clickedButton, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onVoteLocked(this._playerDesk, player);
            })
        );

        const panel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._lockVoteButton);
        const box = WidgetFactory.layoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(panel);
        return box;
    }

    _createWaitingForWidget() {
        const playerName = "?";
        this._waitingFor = WidgetFactory.text()
            .setText(
                locale("ui.agenda.clippy.waiting_for_player_name", {
                    playerName,
                })
            )
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize);

        return this._waitingFor;
    }

    update() {
        const agenda = world.TI4.agenda;
        const deskIndexToColor = world.TI4.getAllPlayerDesks().map(
            (playerDesk) => {
                return playerDesk.widgetColor
                    .toHex()
                    .substring(0, 6)
                    .toLowerCase();
            }
        );

        const deskIndex = this._playerDesk.index;
        let enabled;
        let msg;
        const locked = agenda.getVoteLocked(deskIndex);

        // Whens.
        enabled = !agenda.getNoWhens(deskIndex);
        this._noWhensButton.setEnabled(enabled);
        this._playWhenButton.setEnabled(enabled);

        // Afters.
        enabled = !agenda.getNoAfters(deskIndex);
        this._noAftersButton.setEnabled(enabled);
        this._playAfterButton.setEnabled(enabled);

        enabled = !agenda.getWhensAftersLocked(deskIndex);
        this._lockWhensAftersButton.setEnabled(enabled);

        // Outcomes.
        for (
            let outcomeIndex = 0;
            outcomeIndex < agenda.getNumOutcomes();
            outcomeIndex++
        ) {
            const outcome = this._outcomeData[outcomeIndex];
            outcome.nameText.setText(agenda.getOutcomeName(outcomeIndex));
            enabled = agenda.getVoteOutcomeIndex(deskIndex) !== outcomeIndex;
            enabled = enabled && !locked;
            outcome.voteButton.setEnabled(enabled);
            enabled = agenda.getVoteOutcomeIndex(deskIndex) === outcomeIndex;
            enabled = enabled && !locked;
            outcome.voteDecrButton.setEnabled(enabled);
            outcome.voteIncrButton.setEnabled(enabled);

            let voteTexts = [];
            let total = 0;

            const peerCount = world.TI4.config.playerCount;
            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                const peerOutcomeIndex = agenda.getVoteOutcomeIndex(peerIndex);
                if (peerOutcomeIndex === outcomeIndex) {
                    const votes = agenda.getVoteCount(peerIndex);
                    if (votes > 0) {
                        total += votes;
                        const color = deskIndexToColor[peerIndex];
                        voteTexts.push(`[color=#${color}]${votes}[/color]`);
                    }
                }
            }
            let msg = ` [${total}] ${voteTexts.join(" ")}`;
            outcome.voteText.setText(msg);

            enabled = !locked;
            outcome.predictionDecrButton.setEnabled(enabled);
            outcome.predictionIncrButton.setEnabled(enabled);
            let predictionsTexts = [];
            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                const predictions = agenda.getPredictionCount(
                    peerIndex,
                    outcomeIndex
                );
                if (predictions > 0) {
                    msg = new Array(predictions + 1).join("X");
                    const color = deskIndexToColor[peerIndex];
                    predictionsTexts.push(`[color=#${color}]${msg}[/color]`);
                }
            }
            msg = predictionsTexts.join("");
            outcome.predictionText.setText(msg);
        }

        // Lock votes.
        msg = locked
            ? "ui.agenda.clippy.unlock_vote"
            : "ui.agenda.clippy.lock_vote";
        this._lockVoteButton.setText(locale(msg));

        // Waiting for.
        const stateMachine = agenda.getStateMachine();
        const state = stateMachine && stateMachine.name;
        msg = "ui.agenda.clippy.waiting_for_player_name"; // generic
        if (state === "WHEN") {
            msg = "ui.agenda.clippy.waiting_whens";
        } else if (state === "AFTER") {
            msg = "ui.agenda.clippy.waiting_afters";
        } else if (state === "VOTE") {
            msg = "ui.agenda.clippy.waiting_vote";
        }
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const playerName = currentDesk.colorName;
        this._waitingFor.setText(
            locale(msg, {
                playerName,
            })
        );
    }
}

module.exports = { AgendaUiDesk };
