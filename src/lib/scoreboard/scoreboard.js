const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { Facing } = require("../facing");
const { GameObject, Rotator, Vector, world } = require("../../wrapper/api");

let _scoreboardObj = false;

class Scoreboard {
    static getScoreboard() {
        if (!_scoreboardObj || !_scoreboardObj.isValid()) {
            for (const obj of world.getAllObjects()) {
                if (obj.getContainer()) {
                    continue;
                }
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid !== "token:base/scoreboard") {
                    continue;
                }
                _scoreboardObj = obj;
                break;
            }
        }
        return _scoreboardObj;
    }

    static getScoreLocalPos(scoreboard, score) {
        assert(scoreboard instanceof GameObject);
        assert(typeof score === "number");

        let dir = 1;
        let slotCount = 11;
        if (Facing.isFaceDown(scoreboard)) {
            dir = -1;
            slotCount = 15;
        }
        const scoreboardLocalWidth = scoreboard.getSize().x * 0.99;
        const slotWidth = scoreboardLocalWidth / slotCount;

        const mid = (slotCount - 1) / 2;
        const dLeft = (mid - score) * slotWidth * dir;
        return new Vector(dLeft, 0, 0);
    }

    static getTokenScoreboardPosRot(scoreboard, score, playerSlot) {
        assert(scoreboard instanceof GameObject);
        assert(typeof score === "number");
        assert(typeof playerSlot === "number");

        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        assert(playerDesk);

        const localPos = Scoreboard.getScoreLocalPos(scoreboard, score);

        const playerCount = world.TI4.config.playerCount;
        const numRows = Math.floor(playerCount / 2);
        let index = playerDesk.index;
        let col = 0;
        let row = numRows - 1 - index;
        if (row < 0) {
            row = numRows - 1 - (numRows + row); // swap order
            col = 1;
        }

        // Fix for face down.
        if (Facing.isFaceDown(scoreboard)) {
            col = 1 - col;
        }

        // Make relative to center of score slot.
        row -= (numRows - 1) / 2;
        col -= 0.5;

        const x = localPos.x - col * 2.1;
        const y = localPos.y - row * 2.3;
        //console.log(`[${index}]: (${col}, ${row}) => (${x}, ${y})`);
        let pos = new Vector(x, y, 0);
        pos = scoreboard.localPositionToWorld(pos);
        pos.z = scoreboard.getPosition().z + 5;
        const rot = new Rotator(0, 90, 0).compose(scoreboard.getRotation());
        return {
            pos,
            rot,
        };
    }

    static getScoreFromToken(scoreboard, token) {
        assert(scoreboard instanceof GameObject);
        assert(token instanceof GameObject);

        let dir = -1;
        let slotCount = 11;
        if (Facing.isFaceDown(scoreboard)) {
            dir = 1;
            slotCount = 15;
        }

        const scoreboardLocalWidth = scoreboard.getSize().x * 0.99;
        const slotWidth = scoreboardLocalWidth / slotCount;

        const pos = token.getPosition();
        const localPos = scoreboard.worldPositionToLocal(pos);
        const leftOffset = localPos.x * dir + scoreboardLocalWidth / 2;
        const score = Math.floor(leftOffset / slotWidth);
        return score;
    }

    static getPlayerSlotToTokens(scoreboard) {
        assert(scoreboard instanceof GameObject);

        const size = scoreboard.getSize();
        const bb = {
            min: {
                x: -size.x / 2,
                y: -size.y / 2,
            },
            max: {
                x: size.x / 2,
                y: size.y / 2,
            },
        };

        const playerSlotToTokens = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!ObjectNamespace.isControlToken(obj)) {
                continue;
            }
            const pos = obj.getPosition();
            const localPos = scoreboard.worldPositionToLocal(pos);
            if (
                localPos.x < bb.min.x ||
                localPos.x > bb.max.x ||
                localPos.y < bb.min.y ||
                localPos.y > bb.max.y
            ) {
                continue;
            }
            const playerSlot = obj.getOwningPlayerSlot();
            if (playerSlot < 0) {
                continue;
            }
            let tokens = playerSlotToTokens[playerSlot];
            if (!tokens) {
                tokens = [];
                playerSlotToTokens[playerSlot] = tokens;
            }
            tokens.push(obj);
        }
        return playerSlotToTokens;
    }

    static getPlayerSlotToScore(scoreboard) {
        assert(scoreboard instanceof GameObject);

        const playerSlotToScore = {};
        const playerSlotToTokens = Scoreboard.getPlayerSlotToTokens(scoreboard);
        for (const [playerSlot, tokens] of Object.entries(playerSlotToTokens)) {
            for (const token of tokens) {
                let score = Scoreboard.getScoreFromToken(scoreboard, token);
                const before = playerSlotToScore[playerSlot];
                if (before) {
                    score = Math.max(before, score);
                }
                playerSlotToScore[playerSlot] = score;
            }
        }
        return playerSlotToScore;
    }
}

module.exports = { Scoreboard };
