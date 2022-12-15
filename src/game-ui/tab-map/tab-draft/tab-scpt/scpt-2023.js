const assert = require("../../../../wrapper/assert-wrapper");
const { Broadcast } = require("../../../../lib/broadcast");
const { Gather } = require("../../../../setup/spawn/gather");
const { MiltyDraft } = require("../../../../lib/draft/milty/milty-draft");
const {
    MiltyFactionGenerator,
} = require("../../../../lib/draft/milty/milty-faction-generator");
const { MiltyUtil } = require("../../../../lib/draft/milty/milty-util");
const { ObjectNamespace } = require("../../../../lib/object-namespace");
const { SCPT2023UI } = require("./scpt-2023-ui");
const { TableLayout } = require("../../../../table/table-layout");
const { TURN_ORDER_TYPE } = require("../../../../lib/turns");
const {
    Card,
    DrawingLine,
    Rotator,
    Vector,
    globalEvents,
    world,
} = require("../../../../wrapper/api");

const SECRET_FACTION_RADIUS = 7;
const LINE_TAG = "__SCPT2023";

class SCPT2023 {
    constructor() {
        this._miltyDraft = false;

        const onClickHandlers = {
            start: (scptDraftData) => {
                this._start(scptDraftData);
            },
            cancel: () => {
                this._cancel();
            },
            removeTwoKeleres: () => {
                this._removeTwoKeleres();
            },
            createFactionPools: () => {
                this._createFactionPools();
            },
            chooseFactionPool: () => {
                this._chooseFactionPool();
            },
        };
        this._ui = new SCPT2023UI(onClickHandlers);
    }

    getUI() {
        return this._ui.getWidget();
    }

    _start(scptDraftData) {
        assert(typeof scptDraftData === "object");

        console.log(`SCPT2023._start: ${scptDraftData.name}`);
        if (this._miltyDraft) {
            console.log("SCPT2023._start: in progress, aborting");
            return;
        }
        this._miltyDraft = new MiltyDraft();

        // Slices.
        const slices = scptDraftData.slices.split("|").map((sliceStr) => {
            return MiltyUtil.parseSliceString(sliceStr);
        });
        const labels = scptDraftData.labels.split("|");
        for (let i = 0; i < slices.length; i++) {
            const slice = slices[i];
            const label = labels[i];
            console.log(`${i}: ${slice} "${label}"`);
            this._miltyDraft.addSlice(slice, false, label);
        }

        // Seats.
        const playerCount = world.TI4.config.playerCount;
        const speakerIndex = Math.floor(Math.random() * playerCount);
        this._miltyDraft.setSpeakerIndex(speakerIndex);

        // Factions.
        const factionNsidNames =
            MiltyFactionGenerator.getOnTableFactionCardNsidNames();
        factionNsidNames.forEach((name) => {
            this._miltyDraft.addFaction(name);
        });
        if (factionNsidNames.length < world.TI4.config.playerCount) {
            Broadcast.broadcastAll("Not enough face-up factions!");
            this._miltyDraft = undefined;
            return;
        }

        // Discard faction cards.
        const cards = MiltyFactionGenerator.getOnTableFactionCards();
        const container = undefined;
        const player = undefined;
        globalEvents.TI4.onContainerRejected.trigger(container, cards, player);

        const playerDesks = world.TI4.getAllPlayerDesks();
        world.TI4.turns.randomizeTurnOrder(
            playerDesks,
            player,
            TURN_ORDER_TYPE.SNAKE
        );

        this._eraseFactionPoolLines();
        this._miltyDraft.createPlayerUIs();
    }

    _cancel() {
        console.log("SCPT2023._cancel");

        this._eraseFactionPoolLines();

        if (!this._miltyDraft) {
            return;
        }
        this._miltyDraft.cancel();
        this._miltyDraft = false;
    }

    _removeTwoKeleres() {
        console.log("SCPT2023._removeTwoKeleres");

        let deck = undefined;
        const nsidPrefix = "card.faction_reference";
        for (const candidate of world.getAllObjects()) {
            if (candidate.getContainer()) {
                continue;
            }
            if (!(candidate instanceof Card)) {
                continue;
            }
            if (candidate.getStackSize() <= 1) {
                continue; // look for decks, not cards
            }
            const nsids = ObjectNamespace.getDeckNsids(candidate);
            let found = true;
            for (const candidateNsid of nsids) {
                if (!candidateNsid.startsWith(nsidPrefix)) {
                    found = false;
                    break;
                }
            }
            if (found) {
                deck = candidate;
                break;
            }
        }
        if (!deck) {
            console.log(
                "SCPT2023._removeTwoKeleres: no faction reference deck"
            );
            return;
        }

        let cards = Gather.gather(
            (nsid) => {
                return nsid.startsWith(
                    "card.faction_reference:codex.vigil/keleres_"
                );
            },
            [deck]
        );
        if (cards.length === 0) {
            console.log("SCPT2023._removeTwoKeleres: no cards");
            return;
        }

        // Add the first back to the deck.
        const first = cards.shift();
        first.setTags(["DELETED_ITEMS_IGNORE"]);
        const toFront = true;
        const offset = 0;
        const animate = false;
        const flipped = false;
        deck.addCards(first, toFront, offset, animate, flipped);
        deck.shuffle();

        if (cards.length === 0) {
            console.log("SCPT2023._removeTwoKeleres: only one card");
            return;
        }

        // Merge any remaining cards, set aside.
        const remove = cards.shift();
        for (const card of cards) {
            card.setTags(["DELETED_ITEMS_IGNORE"]);
            const toFront = true;
            const offset = 0;
            const animate = false;
            const flipped = false;
            remove.addCards(card, toFront, offset, animate, flipped);
        }
        let pos = { x: -40, y: 30, z: 5 };
        let rot = new Rotator(0, 0, remove.getStackSize() > 1 ? 180 : 0);
        const anchor = TableLayout.anchor.score;
        pos = TableLayout.anchorPositionToWorld(anchor, pos);
        rot = TableLayout.anchorRotationToWorld(anchor, rot);
        pos.z = world.getTableHeight() + 10;
        remove.setPosition(pos);
        remove.setRotation(rot);
    }

    _createFactionPools() {
        console.log("SCPT2023._createFactionPools");

        this._eraseFactionPoolLines();

        const z = world.getTableHeight() + 0.01;
        const r = SECRET_FACTION_RADIUS;
        const far = 30;

        let line = new DrawingLine();
        line.points = [
            new Vector(-r, -r, z),
            new Vector(-r, r, z),
            new Vector(r, r, z),
            new Vector(r, -r, z),
            new Vector(-r, -r, z),
        ];
        line.rounded = false;
        line.tag = LINE_TAG;
        world.addDrawingLine(line);

        line = new DrawingLine();
        line.points = [new Vector(-r, 0, z), new Vector(-far, 0, z)];
        line.rounded = false;
        line.tag = LINE_TAG;
        world.addDrawingLine(line);

        line = new DrawingLine();
        line.points = [new Vector(r, 0, z), new Vector(far, 0, z)];
        line.rounded = false;
        line.tag = LINE_TAG;
        world.addDrawingLine(line);

        line = new DrawingLine();
        line.points = [new Vector(0, -r, z), new Vector(0, -far, z)];
        line.rounded = false;
        line.tag = LINE_TAG;
        world.addDrawingLine(line);

        line = new DrawingLine();
        line.points = [new Vector(0, r, z), new Vector(0, far, z)];
        line.rounded = false;
        line.tag = LINE_TAG;
        world.addDrawingLine(line);

        // Set random draft turn order.
        const playerDesks = world.TI4.getAllPlayerDesks();
        const player = undefined;
        world.TI4.turns.randomizeTurnOrder(
            playerDesks,
            player,
            TURN_ORDER_TYPE.FORWARD
        );

        // Start timer.
        this._startCountdown(28800);
    }

    _detectFactionPools() {
        const result = {
            secret: undefined,
            a: [],
            b: [],
            c: [],
            d: [],
            summary: "",
        };

        const errors = [];

        const cards = MiltyFactionGenerator.getOnTableFactionCards();
        for (const card of cards) {
            const p = card.getPosition();
            p.z = 0;

            const distance = p.magnitude();
            if (distance < SECRET_FACTION_RADIUS) {
                // Secret.
                if (result.secret) {
                    errors.push("Too many cards in secret faction box");
                    return false;
                }
                result.secret = card;
            } else {
                // Public.
                let angle = (Math.atan2(p.y, p.x) * 180) / Math.PI;
                while (angle < 0) {
                    angle += 360;
                }
                const quadrant = Math.floor(angle / 90);
                const pool = [result.a, result.b, result.c, result.d][quadrant];
                pool.push(card);
            }
        }

        if (!result.secret) {
            errors.push("No face-up card in secret faction box");
        }
        for (const pool of [result.a, result.b, result.c, result.d]) {
            if (pool.length < 6) {
                const names = pool.map((card) => card.getCardDetails().name);
                errors.push(`Pool has too few cards (${names.join(", ")})`);
            } else if (pool.length > 7) {
                const names = pool.map((card) => card.getCardDetails().name);
                errors.push(`Pool has too many cards (${names.join(", ")})`);
            }
        }
        if (errors.length > 0) {
            Broadcast.chatAll(`ERROR: ${errors.join("\n")}`, [1, 0, 0]);
            return false;
        }

        return result;
    }

    _chooseFactionPool() {
        console.log("SCPT2023._chooseFactionPool");

        const poolData = this._detectFactionPools();
        if (!poolData) {
            return;
        }
        const pools = [poolData.a, poolData.b, poolData.c, poolData.d];

        const choiceIndex = Math.min(Math.floor(Math.random() * 4), 3);
        const discard = [];
        pools.forEach((pool, index) => {
            if (index !== choiceIndex) {
                discard.push(...pool);
            }
        });
        console.log(
            `SCPT2023._chooseFactionPool: discarding ${discard.length} cards`
        );

        const container = undefined;
        const player = undefined;
        globalEvents.TI4.onContainerRejected.trigger(
            container,
            discard,
            player
        );

        this._eraseFactionPoolLines();
    }

    _eraseFactionPoolLines() {
        console.log("SCPT2023._eraseFactionPoolLines");

        for (const line of world.getDrawingLines()) {
            if (line.tag === LINE_TAG) {
                world.removeDrawingLineObject(line);
            }
        }
    }

    _startCountdown(seconds) {
        assert(typeof seconds === "number");
        assert(seconds > 0);

        console.log("SCPT2023._startCountdown");

        let timer = undefined;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "tool:base/timer") {
                timer = obj;
                break;
            }
        }
        if (timer) {
            assert(timer.__timer);
            timer.__timer.startCountdown(seconds);
        }
    }
}

module.exports = { SCPT2023 };
