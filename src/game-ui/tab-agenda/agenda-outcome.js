const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { Broadcast } = require("../../lib/broadcast");
const {
    Button,
    HorizontalBox,
    Text,
    TextBox,
    VerticalBox,
    UIElement,
    world,
} = require("../../wrapper/api");

const OUTCOME_TYPE = {
    FOR_AGAINST: "for/against",
    PLAYER: "player",
    OTHER: "other",
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Represent a single outcome for an agenda.
 */
class AgendaOutcome {
    static getDefaultOutcomeNames(outcomeType) {
        assert(typeof outcomeType === "string");
        switch (outcomeType) {
            case OUTCOME_TYPE.FOR_AGAINST:
                return [
                    locale("ui.agenda.outcome.for"),
                    locale("ui.agenda.outcome.against"),
                ];
            case OUTCOME_TYPE.PLAYER:
                return world.TI4.getAllPlayerDesks().map((desk) => {
                    return capitalizeFirstLetter(desk.colorName);
                });
            case OUTCOME_TYPE.OTHER:
                return world.TI4.getAllPlayerDesks().map((desk) => {
                    return "???";
                });
        }
    }

    static getDefaultOutcomes(outcomeType, doUpdateDesks) {
        assert(typeof outcomeType === "string");
        assert(typeof doUpdateDesks === "function");
        const names = AgendaOutcome.getDefaultOutcomeNames(outcomeType);
        const allOutcomes = names.map((name) => {
            return new AgendaOutcome(name, doUpdateDesks);
        });
        allOutcomes.forEach((outcome) => {
            outcome.setAllOutcomes(allOutcomes);
        });
        return allOutcomes;
    }

    static get headerOutcomeName() {
        return new Text()
            .setFontSize(CONFIG.fontSize)
            .setBold(true)
            .setText(locale("ui.agenda.label.outcomes"));
    }

    static get headerPredictions() {
        return new Text()
            .setFontSize(CONFIG.fontSize)
            .setBold(true)
            .setText(locale("ui.agenda.label.predictions"));
    }

    static get headerVotes() {
        return new Text()
            .setFontSize(CONFIG.fontSize)
            .setBold(true)
            .setText(locale("ui.agenda.label.votes"));
    }

    static formatOutcomes(agendaOutcomes, playerDesk) {
        assert(Array.isArray(agendaOutcomes));
        agendaOutcomes.forEach((agendaOutcome) => {
            assert(agendaOutcome instanceof AgendaOutcome);
        });
        assert(playerDesk);

        const colOutcomeName = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(AgendaOutcome.headerOutcomeName, 1);
        const colVotes = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(AgendaOutcome.headerVotes);
        const colPredictions = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(AgendaOutcome.headerPredictions);

        for (const agendaOutcome of agendaOutcomes) {
            colOutcomeName.addChild(agendaOutcome.getOutcomeName());
            colVotes.addChild(agendaOutcome.getVotes(playerDesk));
            colPredictions.addChild(agendaOutcome.getPredictions(playerDesk));
        }

        const columns = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(colOutcomeName)
            .addChild(colVotes)
            .addChild(colPredictions);

        const commitButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.finish"));

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(columns)
            .addChild(commitButton);

        return [panel, commitButton];
    }

    constructor(name, doUpdateDesks) {
        assert(typeof name === "string");
        assert(typeof doUpdateDesks === "function");

        this._name = name;
        this._doUpdateDesks = doUpdateDesks;
        this._mutablePredictions = false;
        this._mutableVotes = false;

        this._deskIndexToPredictions = {};
        this._deskIndexToVoteCount = {};
        this._deskIndexToVoteTexts = {};
        this._deskIndexToUI = {};
        world.TI4.getAllPlayerDesks().forEach((desk) => {
            this._deskIndexToPredictions[desk.index] = [];
            this._deskIndexToVoteCount[desk.index] = 0;
            this._deskIndexToVoteTexts[desk.index] = [];
        });

        this._allOutcomes = [];
        this._deskIndexVoting = new Set();
    }

    get name() {
        return this._name;
    }

    get totalVotes() {
        let total = 0;
        for (const voteCount of Object.values(this._deskIndexToVoteCount)) {
            total += voteCount;
        }
        return total;
    }

    setMutablePredictions(value) {
        this._mutablePredictions = value;
        return this;
    }

    setMutableVotes(value) {
        this._mutableVotes = value;
        return this;
    }

    setAllOutcomes(allOutcomes) {
        assert(Array.isArray(allOutcomes));
        allOutcomes.forEach((agendaOutcome) => {
            assert(agendaOutcome instanceof AgendaOutcome);
        });
        this._allOutcomes = allOutcomes;
    }

    resetTexts() {
        this._deskIndexToVoteTexts = {};
        world.TI4.getAllPlayerDesks().forEach((desk) => {
            this._deskIndexToVoteTexts[desk.index] = [];
        });
    }

    linkUI(deskIndex, UI) {
        assert(typeof deskIndex === "number");
        assert(UI instanceof UIElement);
        this._deskIndexToUI[deskIndex] = UI;
    }

    getOutcomeName() {
        const nameText = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(this._name);
        const editText = new TextBox().setFontSize(CONFIG.fontSize);
        const editButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText("[~]");

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(editButton)
            .addChild(nameText);

        let isEditing = false;
        editButton.onClicked.add((button, player) => {
            if (isEditing) {
                nameText.setText(editText.getText());
                panel.removeAllChildren();
                panel.addChild(editButton).addChild(nameText);
            } else {
                editText.setText(this._name);
                panel.removeAllChildren();
                panel.addChild(editButton).addChild(editText, 1);
            }
            isEditing = !isEditing;
        });

        editText.onTextCommitted.add((textBox, player, text, usingEnter) => {
            if (!usingEnter) {
                return;
            }
            this._name = text;
            nameText.setText(this._name);
            panel.removeAllChildren();
            panel.addChild(editButton).addChild(nameText);

            // Update desks to reflect new outcome name.
            this._doUpdateDesks();
        });

        return panel;
    }

    getVotes(playerDesk) {
        assert(playerDesk);

        const deskIndex = playerDesk.index;
        const result = new HorizontalBox();

        // Add these first so they don't shift when the rest changes.
        if (this._mutableVotes) {
            if (this._deskIndexVoting.has(deskIndex)) {
                const minusButton = new Button()
                    .setFontSize(CONFIG.fontSize)
                    .setText("-");
                minusButton.onClicked.add((button, player) => {
                    const oldValue =
                        this._deskIndexToVoteCount[playerDesk.index];
                    const newValue = Math.max(0, oldValue - 1);
                    this._deskIndexToVoteCount[playerDesk.index] = newValue;
                    this._updateVoteCounts();
                });

                const plusButton = new Button()
                    .setFontSize(CONFIG.fontSize)
                    .setText("+");
                plusButton.onClicked.add((button, player) => {
                    const oldValue =
                        this._deskIndexToVoteCount[playerDesk.index];
                    const newValue = oldValue + 1;
                    this._deskIndexToVoteCount[playerDesk.index] = newValue;
                    this._updateVoteCounts();
                });

                result.addChild(minusButton).addChild(plusButton);
            } else {
                const voteButton = new Button()
                    .setFontSize(CONFIG.fontSize)
                    .setText(locale("ui.agenda.clippy.vote"));
                voteButton.onClicked.add((button, player) => {
                    // Move votes to new outcome.
                    let oldOutcome = false;
                    let oldVotes = 0;
                    for (const outcome of this._allOutcomes) {
                        if (outcome._deskIndexVoting.has(deskIndex)) {
                            oldOutcome = outcome;
                            oldVotes =
                                oldOutcome._deskIndexToVoteCount[deskIndex];
                            oldOutcome._deskIndexToVoteCount[deskIndex] = 0;
                            break;
                        }
                    }
                    this._deskIndexToVoteCount[deskIndex] = oldVotes;

                    // Signal new vote selection.
                    for (const outcome of this._allOutcomes) {
                        outcome._deskIndexVoting.delete(deskIndex);
                    }
                    this._deskIndexVoting.add(deskIndex);

                    // Reset UI.
                    this._doUpdateDesks();
                });
                result.addChild(voteButton);
            }
        }

        result.addChild(new Text().setFontSize(CONFIG.fontSize).setText(" "));
        this._totalVotesText = new Text().setFontSize(CONFIG.fontSize);
        result.addChild(this._totalVotesText);
        result.addChild(new Text().setFontSize(CONFIG.fontSize).setText(" ("));
        world.TI4.getAllPlayerDesks().forEach((desk, index) => {
            if (index > 0) {
                const delim = new Text()
                    .setFontSize(CONFIG.fontSize)
                    .setText("/");
                result.addChild(delim);
            }
            const text = new Text()
                .setFontSize(CONFIG.fontSize)
                .setTextColor(desk.color);
            result.addChild(text);
            this._deskIndexToVoteTexts[desk.index].push(text);
        });
        result.addChild(new Text().setFontSize(CONFIG.fontSize).setText(")"));

        this._updateVoteCounts(true);
        return result;
    }

    getPredictions(playerDesk) {
        assert(playerDesk);
        const result = new HorizontalBox();
        if (this._mutablePredictions) {
            const removePrediction = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText("-");
            removePrediction.onClicked.add((button, player) => {
                const predictions =
                    this._deskIndexToPredictions[playerDesk.index];
                predictions.pop();

                // Update desks to reflect new prediction.
                this._doUpdateDesks();
            });
            result.addChild(removePrediction);

            const addPrediction = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText("+");
            addPrediction.onClicked.add((button, player) => {
                const predictions =
                    this._deskIndexToPredictions[playerDesk.index];
                predictions.push(""); // may put a card NSID here in the future

                const playerName = playerDesk.colorName;
                const prediction = this.name;
                Broadcast.broadcastAll(
                    locale("ui.agenda.clippy.prediction", {
                        playerName,
                        prediction,
                    })
                );

                // Update desks to reflect new prediction.
                this._doUpdateDesks();
            });
            result.addChild(addPrediction);
        }
        world.TI4.getAllPlayerDesks().forEach((desk) => {
            const predictions = this._deskIndexToPredictions[desk.index];
            predictions.forEach((prediction) => {
                const text = new Text()
                    .setFontSize(CONFIG.fontSize)
                    .setTextColor(desk.color)
                    .setText("X");
                result.addChild(text);
            });
        });
        return result;
    }

    _updateVoteCounts(suppressUpdate) {
        this._totalVotesText.setText(`${this.totalVotes}`);

        for (const [deskIndex, votes] of Object.entries(
            this._deskIndexToVoteCount
        )) {
            const votesText = votes > 0 ? `${votes}` : "";
            for (const text of this._deskIndexToVoteTexts[deskIndex]) {
                text.setText(votesText);
            }
        }

        if (!suppressUpdate) {
            // For some reason world.updateUI is not.
            // Use the full _doUpdateDesks "recreate UI" hammer.
            //for (const ui of Object.values(this._deskIndexToUI)) {
            //    assert(ui instanceof UIElement);
            //    world.updateUI(ui);
            //}
            this._doUpdateDesks();
        }
    }
}

module.exports = { AgendaOutcome, OUTCOME_TYPE };
