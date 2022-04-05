const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    Button,
    HorizontalBox,
    Text,
    TextBox,
    VerticalBox,
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
        world.TI4.getAllPlayerDesks().forEach((desk) => {
            this._deskIndexToPredictions[desk.index] = [];
            this._deskIndexToVoteCount[desk.index] = 0;
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

    getOutcomeName() {
        const nameText = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(this._name);
        const editText = new TextBox().setFontSize(CONFIG.fontSize);
        const editButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText("[?]");

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(nameText)
            .addChild(editButton);

        editText.onTextCommitted.add((textBox, player, text, usingEnter) => {
            if (!usingEnter) {
                return;
            }
            console.log("AgendaOutcome.editText");
            this._name = text;
            nameText.setText(this._name);
            panel.removeAllChildren();
            panel.addChild(text).addChild(editButton);

            // Update desks to reflect new outcome name.
            this._doUpdateDesks();
        });

        editButton.onClicked.add((button, player) => {
            console.log("AgendaOutcome.editButton");
            editText.setText(this._name);
            panel.removeAllChildren();
            panel.addChild(editText, 1);
        });

        return panel;
    }

    getPredictions(playerDesk) {
        assert(playerDesk);
        const result = new HorizontalBox();
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
        if (this._mutablePredictions) {
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
        }
        return result;
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
                this._doUpdateDesks();
            });

            const plusButton = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText("+");
            plusButton.onClicked.add((button, player) => {
                const oldValue = this._deskIndexToVoteCount[playerDesk.index];
                const newValue = oldValue + 1;
                this._deskIndexToVoteCount[playerDesk.index] = newValue;
                this._doUpdateDesks();
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
                const comma = new Text()
                    .setFontSize(CONFIG.fontSize)
                    .setText(", ");
                result.addChild(comma);
            }
            const voteCount = this._deskIndexToVoteCount[desk.index];
            const text = new Text()
                .setFontSize(CONFIG.fontSize)
                .setTextColor(desk.color)
                .setText(`${voteCount}`);
            result.addChild(text);
        });
        result.addChild(new Text().setFontSize(CONFIG.fontSize).setText(")"));

        return result;
    }
}

module.exports = { AgendaOutcome };
