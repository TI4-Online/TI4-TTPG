const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { AgendaCardButton } = require("../../lib/agenda/agenda-card-widget");
const {
    AgendaWidgetAvailableVotes,
} = require("./agenda-widget-available-votes");
const { Broadcast } = require("../../lib/broadcast");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const {
    HorizontalAlignment,
    Rotator,
    TextJustification,
    Vector,
    VerticalAlignment,
    world,
} = require("../../wrapper/api");

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
        assert(typeof callbacks.onOutcomeEdit === "function");
        assert(typeof callbacks.onVoteOutcome === "function");
        assert(typeof callbacks.onVoteIncr === "function");
        assert(typeof callbacks.onVoteDecr === "function");
        assert(typeof callbacks.onVoteLocked === "function");
        assert(typeof callbacks.onPredictIncr === "function");
        assert(typeof callbacks.onPredictDecr === "function");

        this._border = WidgetFactory.border();
        this._border.setColor(CONFIG.backgroundColor);

        this._playerDesk = playerDesk;
        this._callbacks = callbacks;

        const localPos = new Vector(30, 0, 20);
        const localRot = new Rotator(25, 0, 0);
        this._ui = WidgetFactory.uiElement();
        this._ui.scale = 1 / CONFIG.scale;
        this._ui.position = playerDesk.localPositionToWorld(localPos);
        this._ui.rotation = playerDesk.localRotationToWorld(localRot);
        this._ui.widget = this._border;

        this._collapsedUi = undefined;
        this._zoomedAgendaCardUi = undefined;

        let panel = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        panel.addChild(
            new AgendaWidgetAvailableVotes(
                CONFIG.fontSize,
                playerDesk.index
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
        midPanel.addChild(midRight);
        const midBox = WidgetFactory.layoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(midPanel);
        panel.addChild(midBox);

        panel.addChild(this._createOutcomesWidget(outcomeNamesMutable));
        panel.addChild(this._createLockCollapseWidget());
        panel.addChild(WidgetFactory.border().setColor(CONFIG.spacerColor));
        panel.addChild(this._createWaitingForWidget());

        const panelBox = WidgetFactory.layoutBox()
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
            .setChild(panel);
        this._border.setChild(panelBox);
    }

    attach() {
        world.addUI(this._ui);
        return this;
    }

    detach() {
        world.removeUIElement(this._ui);
        WidgetFactory.release(this._ui);
        this._ui = undefined;
        if (this._collapsedUi) {
            world.removeUIElement(this._collapsedUi);
            WidgetFactory.release(this._collapsedUi);
            this._collapsedUi = undefined;
        }
        if (this._zoomedAgendaCardUi) {
            world.removeUIElement(this._zoomedAgendaCardUi);
            WidgetFactory.release(this._zoomedAgendaCardUi);
            this._zoomedAgendaCardUi = undefined;
        }
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

    _createAgendaCardWidget() {
        const box = WidgetFactory.layoutBox().setVerticalAlignment(
            VerticalAlignment.Center
        );
        const card = world.TI4.agenda.getAgendaCard();
        if (card) {
            const button = new AgendaCardButton(card);
            const width = 48 * CONFIG.scale;
            button.setImageSize(width, (width * 750) / 500);
            box.setChild(button);

            button.onClicked.add(
                ThrottleClickHandler.wrap((button, player) => {
                    const scale = 3;
                    const width = 330 * scale;
                    const height = (width * 750) / 500;
                    const popupButton = new AgendaCardButton(card);
                    popupButton.setImageSize(width, height);

                    this._zoomedAgendaCardUi = WidgetFactory.uiElement();
                    this._zoomedAgendaCardUi.position = this._ui.position.add([
                        0, 0, 1,
                    ]);
                    this._zoomedAgendaCardUi.rotation = this._ui.rotation;
                    this._zoomedAgendaCardUi.scale = 1 / scale;
                    this._zoomedAgendaCardUi.widget =
                        WidgetFactory.layoutBox().setChild(popupButton);
                    world.addUI(this._zoomedAgendaCardUi);

                    popupButton.onClicked.add(
                        ThrottleClickHandler.wrap((button, player) => {
                            world.removeUIElement(this._zoomedAgendaCardUi);
                            this._zoomedAgendaCardUi = undefined;
                        })
                    );
                })
            );
        }
        return box;
    }

    _createWhensWidget() {
        this._noWhensButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.no_whens"));
        this._playWhenButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.play_when"));

        this._noWhensButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onNoWhens(this._playerDesk, player);
            })
        );
        this._playWhenButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onPlayWhen(this._playerDesk, player);
            })
        );

        const panel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._noWhensButton)
            .addChild(this._playWhenButton);
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
            ThrottleClickHandler.wrap((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onNoAfters(this._playerDesk, player);
            })
        );
        this._playAfterButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onPlayAfter(this._playerDesk, player);
            })
        );

        const panel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._noAftersButton)
            .addChild(this._playAfterButton);
        return panel;
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
            WidgetFactory.getTextext()
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
            const voteTotalText = WidgetFactory.text()
                .setFontSize(CONFIG.fontSize)
                .setText(" [0] ");

            voteButton.onClicked.add(
                ThrottleClickHandler.wrap((button, player) => {
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
            voteDecrButton.onClicked.add((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onVoteDecr(this._playerDesk, player);
            });
            voteIncrButton.onClicked.add((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onVoteIncr(this._playerDesk, player);
            });

            const votePanel = WidgetFactory.horizontalBox()
                .addChild(voteButton)
                .addChild(voteDecrButton)
                .addChild(voteIncrButton)
                .addChild(voteTotalText);
            const voteTexts = [];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const voteText = WidgetFactory.text()
                    .setFontSize(CONFIG.fontSize)
                    .setTextColor(playerDesk.plasticColor)
                    .setText("");
                votePanel.addChild(voteText);
                voteTexts.push(voteText);
            }
            colVotes.addChild(votePanel);

            const predictionDecrButton = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("-");
            const predictionIncrButton = WidgetFactory.button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("+");

            predictionDecrButton.onClicked.add((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onPredictDecr(
                    this._playerDesk,
                    outcomeIndex,
                    player
                );
            });
            predictionIncrButton.onClicked.add((button, player) => {
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
                .addChild(predictionIncrButton);
            const predictionTexts = [];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const predictionText = WidgetFactory.text()
                    .setFontSize(CONFIG.fontSize)
                    .setTextColor(playerDesk.plasticColor)
                    .setText("");
                predictionPanel.addChild(predictionText);
                predictionTexts.push(predictionText);
            }
            colPredictions.addChild(predictionPanel);

            this._outcomeData.push({
                nameText,
                voteButton,
                voteDecrButton,
                voteIncrButton,
                voteTotalText,
                voteTexts,
                predictionDecrButton,
                predictionIncrButton,
                predictionTexts,
            });
        }

        return WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing * 3)
            .addChild(colName)
            .addChild(colVotes)
            .addChild(colPredictions);
    }

    _createLockCollapseWidget() {
        this._lockVoteButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.lock_vote"));
        this._lockVoteButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onVoteLocked(this._playerDesk, player);
            })
        );

        this._collapseButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.button.collapse"));
        this._collapseButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                console.log("AgendaDeskUI.collapse");
                if (!this.allowClick(player)) {
                    return;
                }
                world.removeUIElement(this._ui);

                this._collapsedUi = WidgetFactory.uiElement();
                this._collapsedUi.position = this._ui.position;
                this._collapsedUi.rotation = this._ui.rotation;

                const expandButton = WidgetFactory.button()
                    .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                    .setText(locale("ui.button.expand"));
                const expandButtonBox = WidgetFactory.layoutBox()
                    .setPadding(
                        CONFIG.padding,
                        CONFIG.padding,
                        CONFIG.padding,
                        CONFIG.padding
                    )
                    .setChild(expandButton);
                expandButton.onClicked.add(
                    ThrottleClickHandler.wrap((button, player) => {
                        console.log("AgendaDeskUI.expand");
                        if (!this.allowClick(player)) {
                            return;
                        }
                        world.removeUIElement(this._collapsedUi);
                        this._collapsedUi = undefined;
                        world.addUI(this._ui);
                    })
                );
                this._collapsedUi.widget =
                    WidgetFactory.border().setChild(expandButtonBox);
                world.addUI(this._collapsedUi);
            })
        );

        const panel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._lockVoteButton)
            .addChild(this._collapseButton);
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

            let total = 0;
            const peerCount = world.TI4.config.playerCount;
            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                msg = "";
                const peerOutcomeIndex = agenda.getVoteOutcomeIndex(peerIndex);
                if (peerOutcomeIndex === outcomeIndex) {
                    const votes = agenda.getVoteCount(peerIndex);
                    if (votes > 0) {
                        total += votes;
                        msg = `${votes} `;
                    }
                }
                outcome.voteTexts[peerIndex].setText(msg);
            }
            outcome.voteTotalText.setText(` [${total}] `);

            enabled = !locked;
            outcome.predictionDecrButton.setEnabled(enabled);
            outcome.predictionIncrButton.setEnabled(enabled);
            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                msg = "";
                const predictions = agenda.getPredictionCount(
                    peerIndex,
                    outcomeIndex
                );
                if (predictions > 0) {
                    msg = new Array(predictions + 1).join("X");
                }
                outcome.predictionTexts[peerIndex].setText(msg);
            }
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
