const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    Button,
    HorizontalBox,
    Text,
    TextBox,
    VerticalBox,
    UIElement,
    world,
} = require("../../wrapper/api");

class AgendaOutcome {
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
            .setText("TODO XXX");

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(columns)
            .addChild(commitButton);

        return panel;
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
    }

    setMutablePredictions() {
        this._mutablePredictions = true;
        return this;
    }

    setMutableVotes() {
        this._mutableVotes = true;
        return this;
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
        const result = new HorizontalBox();

        // Add these first so they don't shift when the rest changes.
        if (this._mutableVotes) {
            const minusButton = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText("-");
            minusButton.onClicked.add((button, player) => {
                const oldValue = this._deskIndexToVoteCount[playerDesk.index];
                const newValue = Math.max(0, oldValue - 1);
                this._deskIndexToVoteCount[playerDesk.index] = newValue;
                this._updateVoteCounts();
            });

            const plusButton = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText("+");
            plusButton.onClicked.add((button, player) => {
                const oldValue = this._deskIndexToVoteCount[playerDesk.index];
                const newValue = oldValue + 1;
                this._deskIndexToVoteCount[playerDesk.index] = newValue;
                this._updateVoteCounts();
            });

            result.addChild(minusButton).addChild(plusButton);
        }

        let total = 0;
        for (const voteCount of Object.values(this._deskIndexToVoteCount)) {
            total += voteCount;
        }
        result.addChild(
            new Text().setFontSize(CONFIG.fontSize).setText(`${total} (`)
        );
        world.TI4.getAllPlayerDesks().forEach((desk, index) => {
            if (index > 0) {
                const delim = new Text()
                    .setFontSize(CONFIG.fontSize)
                    .setText("/");
                result.addChild(delim);
            }
            const voteCount = this._deskIndexToVoteCount[desk.index];
            const votesText = voteCount > 0 ? `${voteCount}` : "";
            const text = new Text()
                .setFontSize(CONFIG.fontSize)
                .setTextColor(desk.color)
                .setText(votesText);
            result.addChild(text);
            this._deskIndexToVoteTexts[desk.index].push(text);
        });
        result.addChild(new Text().setFontSize(CONFIG.fontSize).setText(")"));

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

    _updateVoteCounts() {
        for (const [deskIndex, votes] of Object.entries(
            this._deskIndexToVoteCount
        )) {
            const votesText = votes > 0 ? `${votes}` : "";
            for (const text of this._deskIndexToVoteTexts[deskIndex]) {
                text.setText(votesText);
            }
        }
        for (const ui of Object.values(this._deskIndexToUI)) {
            world.updateUI(ui);
        }
    }
}

module.exports = { AgendaOutcome };
