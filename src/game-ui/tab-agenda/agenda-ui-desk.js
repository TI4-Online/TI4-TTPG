const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { Agenda } = require("../../lib/agenda/agenda");
const { Broadcast } = require("../../lib/broadcast");
const {
    Border,
    Button,
    HorizontalAlignment,
    HorizontalBox,
    LayoutBox,
    Rotator,
    Text,
    TextBox,
    TextJustification,
    UIElement,
    Vector,
    VerticalBox,
    world,
} = require("../../wrapper/api");

const ANYONE_CAN_CLICK = false;
const BUTTON_SCALE = 0.75;

/**
 * Per-desk: whens, afters, outcomes
 */
class AgendaUiDesk extends Border {
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

        super();

        this._playerDesk = playerDesk;
        this._callbacks = callbacks;

        const localPos = new Vector(30, 0, 20);
        const localRot = new Rotator(25, 0, 0);
        this._ui = new UIElement();
        this._ui.position = playerDesk.localPositionToWorld(localPos);
        this._ui.rotation = playerDesk.localRotationToWorld(localRot);
        this._ui.widget = this;

        let panel = new VerticalBox().setChildDistance(CONFIG.spacing);

        panel.addChild(this._createAvailabledVotesWidget());
        panel.addChild(new Border().setColor(CONFIG.spacerColor));
        panel.addChild(this._createWhensWidget());
        panel.addChild(this._createAftersWidget());
        panel.addChild(this._createOutcomesWidget(outcomeNamesMutable));
        panel.addChild(this._createLockCollapseWidget());
        panel.addChild(new Border().setColor(CONFIG.spacerColor));
        panel.addChild(this._createWaitingForWidget());

        const panelBox = new LayoutBox()
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
            .setChild(panel);
        this.setChild(panelBox);
    }

    attach() {
        world.addUI(this._ui);
        return this;
    }

    detach() {
        world.removeUIElement(this._ui);
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

    _createAvailabledVotesWidget() {
        const deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();

        const panel = new HorizontalBox().setChildDistance(CONFIG.spacing);
        world.TI4.getAllPlayerDesks().forEach((desk, index) => {
            if (index > 0) {
                const delim = new Text()
                    .setFontSize(CONFIG.fontSize)
                    .setText("|");
                panel.addChild(delim);
            }
            const available = deskIndexToAvailableVotes[index] || 0;
            const text = new Text()
                .setFontSize(CONFIG.fontSize)
                .setTextColor(desk.color)
                .setText(available);
            panel.addChild(text);
        });
        return new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(panel);
    }

    _createWhensWidget() {
        this._noWhensButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.no_whens"));
        this._playWhenButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.play_when"));

        this._noWhensButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._callbacks.onNoWhens(this._playerDesk, player);
        });
        this._playWhenButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._callbacks.onPlayWhen(this._playerDesk, player);
        });

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._noWhensButton)
            .addChild(this._playWhenButton);
        const box = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(panel);
        return box;
    }

    _createAftersWidget() {
        this._noAftersButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.no_afters"));
        this._playAfterButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.play_after"));

        this._noAftersButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._callbacks.onNoAfters(this._playerDesk, player);
        });
        this._playAfterButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._callbacks.onPlayAfter(this._playerDesk, player);
        });

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._noAftersButton)
            .addChild(this._playAfterButton);
        const box = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(panel);
        return box;
    }

    _createOutcomesWidget(outcomeNamesMutable) {
        assert(typeof outcomeNamesMutable === "boolean");

        this._outcomeData = [];

        const colName = new VerticalBox().setChildDistance(CONFIG.spacing);
        const colVotes = new VerticalBox().setChildDistance(CONFIG.spacing);
        const colPredictions = new VerticalBox().setChildDistance(
            CONFIG.spacing
        );

        colName.addChild(
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.outcomes"))
        );
        colVotes.addChild(
            new Text()
                .setFontSize(CONFIG.fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.votes"))
        );
        colPredictions.addChild(
            new Text()
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
            const nameText = outcomeNamesMutable ? new TextBox() : new Text();
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

            const voteButton = new Button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText(locale("ui.agenda.clippy.vote"));
            const voteDecrButton = new Button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("-")
                .setEnabled(false);
            const voteIncrButton = new Button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("+")
                .setEnabled(false);
            const voteTotalText = new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(" [0] ");

            voteButton.onClicked.add((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._callbacks.onVoteOutcome(
                    this._playerDesk,
                    outcomeIndex,
                    player
                );
            });
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

            const votePanel = new HorizontalBox()
                .addChild(voteButton)
                .addChild(voteDecrButton)
                .addChild(voteIncrButton)
                .addChild(voteTotalText);
            const voteTexts = [];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const voteText = new Text()
                    .setFontSize(CONFIG.fontSize)
                    .setTextColor(playerDesk.color)
                    .setText("");
                votePanel.addChild(voteText);
                voteTexts.push(voteText);
            }
            colVotes.addChild(votePanel);

            const predictionDecrButton = new Button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText("-");
            const predictionIncrButton = new Button()
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

            const predictionPanel = new HorizontalBox()
                .addChild(predictionDecrButton)
                .addChild(predictionIncrButton);
            const predictionTexts = [];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const predictionText = new Text()
                    .setFontSize(CONFIG.fontSize)
                    .setTextColor(playerDesk.color)
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

        return new HorizontalBox()
            .setChildDistance(CONFIG.spacing * 3)
            .addChild(colName)
            .addChild(colVotes)
            .addChild(colPredictions);
    }

    _createLockCollapseWidget() {
        this._lockVoteButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.lock_vote"));
        this._lockVoteButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._callbacks.onVoteLocked(this._playerDesk, player);
        });

        this._collapseButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.button.collapse"));
        this._collapseButton.onClicked.add((button, player) => {
            console.log("AgendaDeskUI.collapse");
            if (!this.allowClick(player)) {
                return;
            }
            world.removeUIElement(this._ui);

            const expandButtonUi = new UIElement();
            expandButtonUi.position = this._ui.position;
            expandButtonUi.rotation = this._ui.rotation;

            const expandButton = new Button()
                .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
                .setText(locale("ui.button.expand"));
            const expandButtonBox = new LayoutBox()
                .setPadding(
                    CONFIG.padding,
                    CONFIG.padding,
                    CONFIG.padding,
                    CONFIG.padding
                )
                .setChild(expandButton);
            expandButton.onClicked.add((button, player) => {
                console.log("AgendaDeskUI.expand");
                if (!this.allowClick(player)) {
                    return;
                }
                world.removeUIElement(expandButtonUi);
                world.addUI(this._ui);
            });
            expandButtonUi.widget = new Border().setChild(expandButtonBox);
            world.addUI(expandButtonUi);
        });

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._lockVoteButton)
            .addChild(this._collapseButton);
        const box = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(panel);
        return box;
    }

    _createWaitingForWidget() {
        const playerName = "?";
        this._waitingFor = new Text()
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
