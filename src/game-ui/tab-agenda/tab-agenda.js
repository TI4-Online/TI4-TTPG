const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AgendaOutcome, OUTCOME_TYPE } = require("./agenda-outcome");
const { AgendaStateMachine } = require("./agenda-state-machine");
const { AgendaTurnOrder } = require("./agenda-turn-order");
const { AgendaUiMain } = require("./agenda-ui-main");
const { Broadcast } = require("../../lib/broadcast");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Card,
    LayoutBox,
    Rotator,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { AgendaUiDesk } = require("./agenda-ui-desk");

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class TabAgenda {
    constructor() {
        this._widget = new LayoutBox();
        this._stateMachine = undefined;

        this._outcomeType = undefined;
        this._outcomeNames = undefined;
        this._deskUIs = undefined;
        this._deskIndexToAvailableVotes = undefined;

        globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
            world.TI4.turns.clearAllPassed();
            if (agendaCard) {
                this._stateMachine = new AgendaStateMachine();
            } else {
                this._stateMachine = undefined;
            }
            this._outcomeType = undefined;
            this._outcomeNames = undefined;
            this._deskIndexToAvailableVotes = undefined;
            this.refreshAvailableVotes();
            this.updateUI();
        });

        globalEvents.TI4.onTurnChanged.add(() => {
            if (this._deskUIs) {
                this.updateDeskUI();
            }
        });

        // All players pass to advance to next step.
        globalEvents.TI4.onTurnOrderEmpty.add(() => {
            if (!this._stateMachine) {
                return;
            }
            this._stateMachine.next();
            console.log("TabAgenda: entering " + this._stateMachine.main);
            this.updateMainUI();
        });

        globalEvents.TI4.onPlanetCardFlipped.add((card, isFaceUp) => {
            assert(card instanceof Card);
            assert(typeof isFaceUp === "boolean");

            if (!this._stateMachine || !this._deskUIs) {
                return;
            }

            const pos = card.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            const deskIndex = closestDesk.index;

            const planet = world.TI4.getPlanetByCard(card);
            assert(planet);
            let influence = planet.raw.influence;

            // Add resources to influence value.
            const playerSlot = closestDesk.playerSlot;
            const gromOmegaNsid =
                "card.leader.hero.xxcha:codex.vigil/xxekir_grom.omega";
            if (CardUtil.hasCard(playerSlot, gromOmegaNsid, false)) {
                influence += planet.raw.resources;
            }

            const deskIndexToPerPlanetBonus =
                this.getDeskIndexToPerPlanetBonus();
            const bonus = deskIndexToPerPlanetBonus[deskIndex] || 0;
            influence += bonus;

            const deltaValue = influence * (isFaceUp ? -1 : 1);
            console.log(
                `TabAgenda.onPlanetCardFlipped: ${deltaValue} for ${closestDesk.colorName}`
            );

            for (const deskUi of this._deskUIs) {
                if (
                    deskUi._playerDesk === closestDesk &&
                    deskUi._votedOutcomeIndex >= 0
                ) {
                    deskUi.addVotes(deltaValue);
                    break;
                }
            }
        });

        this.updateUI();
    }

    getUI() {
        return this._widget;
    }

    getDeskIndexToPerPlanetBonus() {
        const result = {};

        let xxchaCommanderIndex = -1;
        let xxchaAllianceIndex = -1;

        const checkIsDiscardPile = false;
        const allowFaceDown = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "card.leader.commander.xxcha:pok/elder_qanoj") {
                const pos = obj.getPosition();
                const closestDesk = world.TI4.getClosestPlayerDesk(pos);
                xxchaCommanderIndex = closestDesk.index;
            } else if (nsid === "card.alliance:base/xxcha") {
                const pos = obj.getPosition();
                const closestDesk = world.TI4.getClosestPlayerDesk(pos);
                xxchaAllianceIndex = closestDesk.index;
            }
        }

        if (xxchaCommanderIndex >= 0) {
            result[xxchaCommanderIndex] = 1;

            // Alliance only applies if commander is unlocked.
            if (
                xxchaAllianceIndex >= 0 &&
                xxchaAllianceIndex != xxchaCommanderIndex
            ) {
                result[xxchaAllianceIndex] = 1;
            }
        }
        return result;
    }

    refreshAvailableVotes() {
        const deskIndexToPerPlanetBonus = this.getDeskIndexToPerPlanetBonus();

        this._deskIndexToAvailableVotes = {};
        const checkIsDiscardPile = false;
        const allowFaceDown = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const planet = world.TI4.getPlanetByCard(obj);
            if (!planet) {
                continue;
            }

            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (!closestDesk) {
                continue;
            }

            const deskIndex = closestDesk.index;
            const oldValue = this._deskIndexToAvailableVotes[deskIndex] || 0;
            let newValue = oldValue + planet.raw.influence;

            const bonus = deskIndexToPerPlanetBonus[deskIndex] || 0;
            newValue += bonus;

            this._deskIndexToAvailableVotes[deskIndex] = newValue;
        }
    }

    updateUI() {
        this.updateMainUI();
        this.updateDeskUI();
    }

    updateMainUI() {
        // Abort if not active.
        if (!this._stateMachine) {
            this._widget.setChild(
                AgendaUiMain.simpleNoMechy(
                    locale("ui.agenda.clippy.place_agenda_to_start")
                )
            );
            return;
        }

        const onNext = (button, player) => {
            this._stateMachine.next();
            this.updateUI();
        };
        const onCancel = (button, player) => {
            this._stateMachine = undefined;
            this.updateUI();
        };
        const onOutcomeType = (outcomeType) => {
            this._outcomeType = outcomeType;
            this._outcomeNames =
                AgendaOutcome.getDefaultOutcomeNames(outcomeType);
            this.updateDeskUI();
            this._stateMachine.next();
            this.updateUI();
        };
        const onResetPlanetCards = () => {
            const checkIsDiscardPile = false;
            const allowFaceDown = true;
            for (const obj of world.getAllObjects()) {
                if (
                    !CardUtil.isLooseCard(
                        obj,
                        checkIsDiscardPile,
                        allowFaceDown
                    )
                ) {
                    continue;
                }
                const nsid = ObjectNamespace.getNsid(obj);
                if (!nsid.startsWith("card.planet")) {
                    continue;
                }
                if (!obj.isFaceUp()) {
                    const rotation = obj.getRotation();
                    const newRotation = new Rotator(
                        rotation.pitch,
                        rotation.yaw,
                        -180
                    );
                    obj.setRotation(newRotation, 1);
                }
            }
            this.updateUI();
        };
        const outcomeButtonTextsAndOnClicks = [
            {
                text: locale("ui.agenda.outcome_type.for_against"),
                onClick: (button, player) => {
                    onOutcomeType(OUTCOME_TYPE.FOR_AGAINST);
                },
            },
            {
                text: locale("ui.agenda.outcome_type.player"),
                onClick: (button, player) => {
                    onOutcomeType(OUTCOME_TYPE.PLAYER);
                },
            },
            {
                text: locale("ui.agenda.outcome_type.other"),
                onClick: (button, player) => {
                    onOutcomeType(OUTCOME_TYPE.OTHER);
                },
            },
        ];
        let order;
        let summary = "";

        switch (this._stateMachine.main) {
            case "START.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleYesNo(
                        locale("ui.agenda.clippy.would_you_like_help"),
                        onNext,
                        onCancel
                    )
                );
                break;
            case "OUTCOME_TYPE.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleButtonList(
                        locale("ui.agenda.clippy.outcome_category"),
                        outcomeButtonTextsAndOnClicks
                    )
                );
                break;
            case "WHEN.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simple(locale("ui.agenda.clippy.whens"))
                );
                order = AgendaTurnOrder.getResolveOrder();
                world.TI4.turns.setTurnOrder(order);
                this.updatePassedForNewPhase(); // sets turn
                this.updateDeskUI();
                break;
            case "AFTER.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simple(locale("ui.agenda.clippy.afters"))
                );
                order = AgendaTurnOrder.getResolveOrder();
                world.TI4.turns.setTurnOrder(order);
                this.updatePassedForNewPhase(); // sets turn
                this.updateDeskUI();
                break;
            case "VOTE.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simple(locale("ui.agenda.clippy.voting"))
                );
                order = AgendaTurnOrder.getVoteOrder();
                world.TI4.turns.setTurnOrder(order);
                this.updatePassedForNewPhase(); // sets turn
                this.updateDeskUI();
                break;
            case "POST.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simple(locale("ui.agenda.clippy.post"))
                );
                order = AgendaTurnOrder.getResolveOrder();
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                this.updateDeskUI();
                break;
            case "FINISH.MAIN":
                summary = AgendaUiDesk.summarizeVote(this._deskUIs);
                summary = locale("ui.agenda.clippy.outcome", {
                    outcome: summary,
                });
                this._stateMachine = undefined;
                this.updateDeskUI();
                this._widget.setChild(
                    AgendaUiMain.simpleButton(
                        summary,
                        locale("ui.agenda.clippy.reset_cards"),
                        onResetPlanetCards
                    )
                );
                Broadcast.chatAll(summary);
                break;
            default:
                throw new Error(`unknown state "${this._stateMachine.main}"`);
        }
    }

    updateDeskUI() {
        // Abort if not active.
        if (!this._stateMachine || !this._outcomeNames) {
            if (this._deskUIs) {
                for (const deskUI of this._deskUIs) {
                    deskUI.detach();
                }
            }
            this._deskUIs = undefined;
            return;
        }

        const callbacks = {
            onNoWhens: (playerDesk, player) => {
                if (this._stateMachine.main === "WHEN.MAIN") {
                    world.TI4.turns.setPassed(playerDesk.playerSlot, true);
                    if (world.TI4.turns.getCurrentTurn() === playerDesk) {
                        world.TI4.turns.endTurn(player);
                    }
                }
            },
            onPlayWhen: (playerDesk, player) => {
                const playerName = capitalizeFirstLetter(playerDesk.colorName);
                Broadcast.chatAll(
                    locale("ui.agenda.clippy.playing_when_player_name", {
                        playerName,
                    })
                );
                if (
                    this._stateMachine.main === "WHEN.MAIN" &&
                    world.TI4.turns.getCurrentTurn() === playerDesk
                ) {
                    world.TI4.turns.endTurn(player);
                }
            },
            onNoAfters: (playerDesk, player) => {
                if (this._stateMachine.main === "AFTER.MAIN") {
                    world.TI4.turns.setPassed(playerDesk.playerSlot, true);
                    if (world.TI4.turns.getCurrentTurn() === playerDesk) {
                        world.TI4.turns.endTurn(player);
                    }
                }
            },
            onPlayAfter: (playerDesk, player) => {
                const playerName = capitalizeFirstLetter(playerDesk.colorName);
                Broadcast.chatAll(
                    locale("ui.agenda.clippy.playing_after_player_name", {
                        playerName,
                    })
                );
                if (
                    this._stateMachine.main === "AFTER.MAIN" &&
                    world.TI4.turns.getCurrentTurn() === playerDesk
                ) {
                    world.TI4.turns.endTurn(player);
                }
            },
            onVoteLocked: (playerDesk, player, isLocked) => {
                if (this._stateMachine.main === "VOTE.MAIN") {
                    world.TI4.turns.setPassed(playerDesk.playerSlot, isLocked);
                    if (world.TI4.turns.getCurrentTurn() === playerDesk) {
                        world.TI4.turns.endTurn(player);
                    }
                }
            },
        };

        // Create if missing.
        if (!this._deskUIs) {
            this._deskUIs = [];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const deskUi = new AgendaUiDesk(
                    playerDesk,
                    this._outcomeNames,
                    this._outcomeType === OUTCOME_TYPE.OTHER,
                    this._deskIndexToAvailableVotes,
                    callbacks
                );
                deskUi.attach();
                this._deskUIs.push(deskUi);
            }
            for (const deskUi of this._deskUIs) {
                deskUi.setPeers(this._deskUIs);
            }
        }

        if (this._stateMachine.main === "WHEN.MAIN") {
            AgendaUiDesk.updateWaitingForWhen(this._deskUIs);
        }
        if (this._stateMachine.main === "AFTER.MAIN") {
            AgendaUiDesk.updateWaitingForAfter(this._deskUIs);
        }
        if (this._stateMachine.main === "VOTE.MAIN") {
            AgendaUiDesk.updateWaitingForVote(this._deskUIs);
        }
    }

    updatePassedForNewPhase() {
        world.TI4.turns.clearAllPassed();
        if (!this._deskUIs) {
            return;
        }

        // Players can click "no whens", etc, early.  Mark them as passed when
        // changing to a new state.
        console.log(
            "TabAgenda.updatePassedForNewPhase: " + this._stateMachine.main
        );
        const passedSlotSet = new Set();
        for (const deskUi of this._deskUIs) {
            let active = true;
            assert(typeof deskUi._noWhens === "boolean");
            if (this._stateMachine.main === "WHEN.MAIN" && deskUi._noWhens) {
                active = false;
            }
            assert(typeof deskUi._noAfters === "boolean");
            if (this._stateMachine.main === "AFTER.MAIN" && deskUi._noAfters) {
                active = false;
            }
            assert(typeof deskUi._voteLocked === "boolean");
            if (this._stateMachine.main === "VOTE.MAIN" && deskUi._voteLocked) {
                active = false;
            }
            if (!active) {
                console.log(
                    `TabAgenda.updatePassedForNewPhase: ${deskUi._playerDesk.colorName} passing`
                );
                const playerSlot = deskUi._playerDesk.playerSlot;
                passedSlotSet.add(playerSlot);
                world.TI4.turns.setPassed(playerSlot, true);
            }
        }

        // Set turn to first unpassed player.
        const order = world.TI4.turns.getTurnOrder();
        for (const desk of order) {
            if (passedSlotSet.has(desk.playerSlot)) {
                continue;
            }
            world.TI4.turns.setCurrentTurn(desk, undefined);
            return;
        }

        // If we get here all players have passed.
        this._stateMachine.next();
        console.log(
            "TabAgenda.updatePassedForNewPhase: entering " +
                this._stateMachine.main
        );
        this.updateMainUI();
    }
}

module.exports = { TabAgenda };
