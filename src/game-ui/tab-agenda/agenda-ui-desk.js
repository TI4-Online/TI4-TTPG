const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
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

const ANYONE_CAN_CLICK = true;
const BUTTON_SCALE = 0.75;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Per-desk: whens, afters, outcomes
 */
class AgendaUiDesk extends Border {
    /**
     * Update text fields
     *
     * @param {Array} agendaUiDesks
     */
    static updateVoteAndPredictionCounts(agendaUiDesks) {
        assert(Array.isArray(agendaUiDesks));

        // Clear all per-player vote, prediction text.  Default button enables.
        for (const agendaUiDesk of agendaUiDesks) {
            const isLocked = agendaUiDesk._voteLocked;
            const m = isLocked
                ? "ui.agenda.clippy.unlock_vote"
                : "ui.agenda.clippy.lock_vote";
            agendaUiDesk._lockVoteButton.setText(locale(m));

            for (let i = 0; i < agendaUiDesk._outcomeData.length; i++) {
                const outcomeData = agendaUiDesk._outcomeData[i];
                const myOutcome = i === agendaUiDesk._votedOutcomeIndex;
                outcomeData.voteButton.setEnabled(!myOutcome && !isLocked);
                outcomeData.voteDecrButton.setEnabled(myOutcome && !isLocked);
                outcomeData.voteIncrButton.setEnabled(myOutcome && !isLocked);
                outcomeData.predictionDecrButton.setEnabled(!isLocked);
                outcomeData.predictionIncrButton.setEnabled(!isLocked);
                for (const voteText of outcomeData.voteTexts) {
                    voteText.setText("");
                }
                for (const predictionText of outcomeData.predictionTexts) {
                    predictionText.setText("");
                }
            }
        }

        // Apply per-player votes, swap selected button enabled.
        for (const agendaUiDesk of agendaUiDesks) {
            if (
                agendaUiDesk._votedOutcomeIndex < 0 ||
                agendaUiDesk._votesCast <= 0
            ) {
                continue;
            }
            const deskIndex = agendaUiDesk._playerDesk.index;
            const voteOutcomeIndex = agendaUiDesk._votedOutcomeIndex;
            const voteValueText = `${agendaUiDesk._votesCast} `;
            for (const peer of agendaUiDesks) {
                const outcome = peer._outcomeData[voteOutcomeIndex];
                const voteText = outcome.voteTexts[deskIndex];
                voteText.setText(voteValueText);
            }
        }

        // Apply per-player predictions.
        for (const agendaUiDesk of agendaUiDesks) {
            const deskIndex = agendaUiDesk._playerDesk.index;
            for (const [prediction, count] of Object.entries(
                agendaUiDesk._predictedOutcomeIndexToCount
            )) {
                for (const peer of agendaUiDesks) {
                    const outcome = peer._outcomeData[prediction];
                    const predictionText = outcome.predictionTexts[deskIndex];
                    const value = new Array(count + 1).join("X");
                    predictionText.setText(value);
                }
            }
        }

        // Apply vote totals.
        const count = agendaUiDesks[0]._outcomeData.length;
        const totals = Array(count).fill(0);
        for (const agendaUiDesk of agendaUiDesks) {
            const deskOucome = agendaUiDesk._votedOutcomeIndex;
            totals[deskOucome] += agendaUiDesk._votesCast;
        }
        for (const agendaUiDesk of agendaUiDesks) {
            for (let i = 0; i < totals.length; i++) {
                const total = totals[i];
                const outcomeData = agendaUiDesk._outcomeData[i];
                const totalText = outcomeData.voteTotalText;
                const value = ` [${total}] `;
                totalText.setText(value);
            }
        }
    }

    static _current(agendaUiDesks) {
        assert(Array.isArray(agendaUiDesks));

        const current = world.TI4.turns.getCurrentTurn();
        for (const agendaUiDesk of agendaUiDesks) {
            if (agendaUiDesk._playerDesk === current) {
                return agendaUiDesk;
            }
        }
    }

    /**
     * Update the waiting for message for the next desk to "when".
     *
     * @param {Array.{AgendaUiDesk}} agendaUiDesks
     * @param {Array.{PlayerDesk}} order
     * @returns {boolean} true if at least one desk is waiting
     */
    static updateWaitingForWhen(agendaUiDesks) {
        assert(Array.isArray(agendaUiDesks));

        const first = AgendaUiDesk._current(agendaUiDesks);
        if (!first) {
            return false;
        }

        const playerName = capitalizeFirstLetter(first._playerDesk.colorName);
        const msg = locale("ui.agenda.clippy.waiting_whens", { playerName });
        for (const agendaUiDesk of agendaUiDesks) {
            agendaUiDesk._waitingFor.setText(msg);
        }

        return true;
    }

    /**
     * Update the waiting for message for the next desk to "when".
     *
     * @param {Array.{AgendaUiDesk}} agendaUiDesks
     * @param {Array.{PlayerDesk}} order
     * @returns {boolean} true if at least one desk is waiting
     */
    static updateWaitingForAfter(agendaUiDesks) {
        assert(Array.isArray(agendaUiDesks));

        const first = AgendaUiDesk._current(agendaUiDesks);
        if (!first) {
            return false;
        }

        const playerName = capitalizeFirstLetter(first._playerDesk.colorName);
        const msg = locale("ui.agenda.clippy.waiting_afters", { playerName });
        for (const agendaUiDesk of agendaUiDesks) {
            agendaUiDesk._waitingFor.setText(msg);
        }

        return true;
    }

    /**
     * Update the waiting for message for the next desk to "when".
     *
     * @param {Array.{AgendaUiDesk}} agendaUiDesks
     * @param {Array.{PlayerDesk}} order
     * @returns {boolean} true if at least one desk is waiting
     */
    static updateWaitingForVote(agendaUiDesks) {
        assert(Array.isArray(agendaUiDesks));

        const first = AgendaUiDesk._current(agendaUiDesks);
        if (!first) {
            return false;
        }

        const playerName = capitalizeFirstLetter(first._playerDesk.colorName);
        const msg = locale("ui.agenda.clippy.waiting_vote", { playerName });
        for (const agendaUiDesk of agendaUiDesks) {
            agendaUiDesk._waitingFor.setText(msg);
        }

        return true;
    }

    static summarizeVote(agendaUiDesks) {
        assert(Array.isArray(agendaUiDesks));
        const agendaUiDesk = agendaUiDesks[0];
        assert(agendaUiDesk);

        const result = [];
        for (const outcome of agendaUiDesk._outcomeData) {
            let voteTotalText = outcome.voteTotalText.getText();
            voteTotalText = voteTotalText.replace(/[^0-9]/g, "");
            result.push(`"${outcome.nameText.getText()}": ${voteTotalText}`);
        }
        return result.join(", ");
    }

    constructor(
        playerDesk,
        outcomeNames,
        outcomeNamesMutable,
        deskIndexToAvailableVotes,
        callbacks
    ) {
        assert(playerDesk);
        assert(Array.isArray(outcomeNames));
        assert(typeof outcomeNamesMutable === "boolean");
        assert(deskIndexToAvailableVotes);
        assert(callbacks);

        assert(typeof callbacks.onNoWhens === "function");
        assert(typeof callbacks.onPlayWhen === "function");
        assert(typeof callbacks.onNoAfters === "function");
        assert(typeof callbacks.onPlayAfter === "function");
        assert(typeof callbacks.onVoteLocked === "function");

        super();

        this._playerDesk = playerDesk;
        this._callbacks = callbacks;

        this._noWhens = false;
        this._playedWhen = false;
        this._noAfters = false;
        this._playedAfter = false;

        this._votedOutcomeIndex = -1;
        this._votesCast = 0;
        this._voteLocked = false;
        this._predictedOutcomeIndexToCount = {};

        this._waitingFor = undefined;
        this._ui = undefined;

        // ALL AgendaUiDesk, INCLUDING SELF!
        this._peers = [];

        // { nameText, voteTotalText, voteTexts, predictionTexts }
        this._outcomeData = [];

        const panel = new VerticalBox().setChildDistance(CONFIG.spacing);

        const panelBox = new LayoutBox()
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
            .setChild(panel);
        this.setChild(panelBox);

        // Available votes.
        panel.addChild(
            this._createAvailabledVotesWidget(deskIndexToAvailableVotes)
        );
        panel.addChild(new Border().setColor(CONFIG.spacerColor));

        // Whens, afters.
        panel.addChild(this._createWhensWidget());
        panel.addChild(this._createAftersWidget());
        panel.addChild(new Border().setColor(CONFIG.spacerColor));

        // OUTCOMES.
        panel.addChild(
            this._createOutcomesWidget(outcomeNames, outcomeNamesMutable)
        );
        this._lockVoteButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.lock_vote"));
        this._lockVoteButton.onClicked.add((button, player) => {
            this._voteLocked = !this._voteLocked;
            AgendaUiDesk.updateVoteAndPredictionCounts(this._peers);
            this._callbacks.onVoteLocked(
                this._playerDesk,
                player,
                this._voteLocked
            );
        });
        panel.addChild(
            new LayoutBox()
                .setHorizontalAlignment(HorizontalAlignment.Center)
                .setChild(this._lockVoteButton)
        );
        panel.addChild(new Border().setColor(CONFIG.spacerColor));

        // Waiting for...?
        const playerName = "?";
        this._waitingFor = new Text()
            .setText(
                locale("ui.agenda.clippy.waiting_for_player_name", {
                    playerName,
                })
            )
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize);
        panel.addChild(this._waitingFor);

        // Position UI for desk.
        const localPos = new Vector(30, 0, 20);
        const localRot = new Rotator(25, 0, 0);
        this._ui = new UIElement();
        this._ui.position = playerDesk.localPositionToWorld(localPos);
        this._ui.rotation = playerDesk.localRotationToWorld(localRot);
        this._ui.widget = this;
    }

    setPeers(peers) {
        assert(Array.isArray(peers));
        this._peers = peers;
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
        player.showMessage("Not yours");
    }

    addVotes(deltaValue) {
        assert(typeof deltaValue === "number");
        this._votesCast = Math.max(0, this._votesCast + deltaValue);
        AgendaUiDesk.updateVoteAndPredictionCounts(this._peers);
    }

    _createAvailabledVotesWidget(deskIndexToAvailableVotes) {
        assert(deskIndexToAvailableVotes);

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
        const noWhensButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.no_whens"));
        const playWhenButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.play_when"));

        noWhensButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._noWhens = true;
            noWhensButton.setEnabled(false);
            playWhenButton.setEnabled(false);
            this._callbacks.onNoWhens(this._playerDesk, player);
        });

        playWhenButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._playedWhen = true;
            this._callbacks.onPlayWhen(this._playerDesk, player);
        });

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(noWhensButton)
            .addChild(playWhenButton);
        return new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(panel);
    }

    _createAftersWidget() {
        const noAftersButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.no_afters"));
        const playAfterButton = new Button()
            .setFontSize(CONFIG.fontSize * BUTTON_SCALE)
            .setText(locale("ui.agenda.clippy.play_after"));

        noAftersButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._noAfters = true;
            noAftersButton.setEnabled(false);
            playAfterButton.setEnabled(false);
            this._callbacks.onNoAfters(this._playerDesk, player);
        });

        playAfterButton.onClicked.add((button, player) => {
            if (!this.allowClick(player)) {
                return;
            }
            this._playedAfter = true;
            this._callbacks.onPlayAfter(this._playerDesk, player);
        });

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(noAftersButton)
            .addChild(playAfterButton);
        return new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(panel);
    }

    _createOutcomesWidget(outcomeNames, outcomeNamesMutable) {
        assert(Array.isArray(outcomeNames));
        assert(typeof outcomeNamesMutable === "boolean");

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

        this._outcomeData = [];

        for (let i = 0; i < outcomeNames.length; i++) {
            const outcomeName = outcomeNames[i];
            const nameText = outcomeNamesMutable ? new TextBox() : new Text();
            nameText.setFontSize(CONFIG.fontSize).setText(outcomeName);
            if (outcomeNamesMutable) {
                let lazyUpdateTimeoutHandle = undefined;
                const lazyUpdate = () => {
                    lazyUpdateTimeoutHandle = undefined;
                    const value = nameText.getText();
                    for (const peer of this._peers) {
                        if (peer !== this) {
                            peer._outcomeData[i].nameText.setText(value);
                        }
                    }
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
                this._votedOutcomeIndex = i;
                AgendaUiDesk.updateVoteAndPredictionCounts(this._peers);
            });
            voteDecrButton.onClicked.add((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._votesCast = Math.max(0, this._votesCast - 1);
                AgendaUiDesk.updateVoteAndPredictionCounts(this._peers);
            });
            voteIncrButton.onClicked.add((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                this._votesCast = Math.min(500, this._votesCast + 1);
                AgendaUiDesk.updateVoteAndPredictionCounts(this._peers);
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
                let count = this._predictedOutcomeIndexToCount[i];
                if (count === undefined) {
                    count = 0;
                }
                count = Math.max(0, count - 1);
                this._predictedOutcomeIndexToCount[i] = count;
                AgendaUiDesk.updateVoteAndPredictionCounts(this._peers);
            });
            predictionIncrButton.onClicked.add((button, player) => {
                if (!this.allowClick(player)) {
                    return;
                }
                let count = this._predictedOutcomeIndexToCount[i];
                if (count === undefined) {
                    count = 0;
                }
                count = Math.min(10, count + 1);
                this._predictedOutcomeIndexToCount[i] = count;
                AgendaUiDesk.updateVoteAndPredictionCounts(this._peers);
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

    attach() {
        world.addUI(this._ui);
        return this;
    }

    detach() {
        world.removeUIElement(this._ui);
        return this;
    }

    update() {
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const playerName = currentDesk.colorName;
        this._waitingFor.setText(
            locale("ui.agenda.clippy.waiting_for_player_name", {
                playerName,
            })
        );
    }
}

module.exports = { AgendaUiDesk };
