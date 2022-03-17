const assert = require("../wrapper/assert-wrapper");
const { Scoreboard } = require("../lib/scoreboard/scoreboard");
const {
    GameObject,
    Rotator,
    Text,
    UIElement,
    globalEvents,
    refObject,
    world,
} = require("../wrapper/api");

class ScoreboardObj {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;

        gameObject.onMovementStopped.add((obj) => {
            this.update();
        });
        globalEvents.TI4.onGameSetup.add((config) => {
            this.update();
        });

        this.update();
    }

    update() {
        const gamePoints = world.TI4.config.gamePoints;
        console.log(gamePoints);

        for (const ui of this._obj.getUIs()) {
            this._obj.removeUI(ui);
        }
        const startIndex = gamePoints + 1;
        const endIndex = gamePoints <= 10 ? 10 : 14;
        for (let i = startIndex; i <= endIndex; i++) {
            let pos = Scoreboard.getScoreLocalPos(this._obj, i);
            let rot = new Rotator(0, 90, 0);

            world.showPing(this._obj.localPositionToWorld(pos), [1, 0, 0]);

            if (gamePoints < 10) {
                pos.z = this._obj.getSize().z + 0.01;
            } else {
                pos.z = -0.01;
                rot.pitch = 180;
            }

            const ui = new UIElement();
            ui.position = pos; // local!
            ui.rotation = rot;
            ui.widget = new Text()
                .setTextColor([0.2, 0.2, 0.2, 1])
                .setFontSize(40)
                .setText("X");
            this._obj.addUI(ui);
        }
    }
}

refObject.onCreated.add((obj) => {
    new ScoreboardObj(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new ScoreboardObj(refObject);
}
