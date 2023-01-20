const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { WidgetFactory } = require("../ui/widget-factory");
const {
    HorizontalAlignment,
    Player,
    PlayerPermission,
    globalEvents,
    world,
} = require("../../wrapper/api");

const WIDTH = 400;
const HEIGHT = 100;
const FONT_SIZE = HEIGHT * 0.13;
const SCREEN_X = 50; // top of widget
const BORDER_SIZE = 2;

// Do not set the spectator camera every frame, it causes UI interaction woes.
const MIN_DELAY_MSECS = 300;
const MIN_DELAY_FRAMES = 10;

const _spectatorPlayerSlotToFollow = {};

class FollowCamera {
    /**
     * Start following another player's camera.  Do not use the constructor directly!
     *
     * @param {Player} spectatorPlayer
     * @param {number} followPlayerIndex - player desk index, -1 to stop
     */
    static follow(spectatorPlayer, followPlayerIndex) {
        assert(spectatorPlayer instanceof Player);
        assert(typeof followPlayerIndex === "number");

        const spectatorPlayerSlot = spectatorPlayer.getSlot();

        // Release any existing following.
        let follow = _spectatorPlayerSlotToFollow[spectatorPlayerSlot];
        if (follow) {
            console.log("FollowCamera.follow: stopping existing follow");
            follow.stop();
            delete _spectatorPlayerSlotToFollow[spectatorPlayerSlot];
        }

        // Make sure the player requesting to follow is a spectator.
        const spectatorDesk =
            world.TI4.getPlayerDeskByPlayerSlot(spectatorPlayerSlot);
        if (spectatorDesk) {
            console.log(
                "FollowCamera.follow: request by a seated player denied, aborting"
            );
            return;
        }

        // Only let the host follow another player.
        if (!spectatorPlayer.isHost()) {
            console.log(
                "FollowCamera.follow: request by a non-host player denied, aborting"
            );
            return;
        }

        // Make sure the followed desk exists.
        const playerDesks = world.TI4.getAllPlayerDesks();
        const playerDesk = playerDesks[followPlayerIndex];
        if (!playerDesk) {
            console.log(
                `FollowCamera.follow: no player desk "${followPlayerIndex}", aborting`
            );
            return;
        }

        // Make sure the followed player exists.
        const followPlayer = world.getPlayerBySlot(playerDesk.playerSlot);
        if (!followPlayer) {
            console.log(
                `FollowCamera.follow: no player index "${followPlayerIndex}", aborting`
            );
            return;
        }

        // Start a new follow.
        console.log("FollowCamera.follow: starting new follow");
        follow = new FollowCamera(spectatorPlayer, followPlayerIndex).start();
        _spectatorPlayerSlotToFollow[spectatorPlayerSlot] = follow;
    }

    constructor(spectatorPlayer, followPlayerIndex) {
        assert(spectatorPlayer instanceof Player);
        assert(typeof followPlayerIndex === "number");

        this._screenUI = this._createScreenUI(
            spectatorPlayer,
            followPlayerIndex
        );

        this._frameCount = 0;
        this._lastUpdateFrameCount = 0;
        this._lastUpdateTimestamp = 0;

        const playerDesks = world.TI4.getAllPlayerDesks();
        const followPlayerDesk = playerDesks[followPlayerIndex];
        const followPlayerSlot = followPlayerDesk
            ? followPlayerDesk.playerSlot
            : -1;
        const followPlayer = world.getPlayerBySlot(followPlayerSlot);

        this._onTickHandler = () => {
            this._frameCount += 1;

            const now = Date.now();
            if (this._lastUpdateFrameCount > 0) {
                const deltaFrames =
                    this._frameCount - this._lastUpdateFrameCount;
                const deltaTime = now - this._lastUpdateTimestamp;
                if (
                    deltaFrames < MIN_DELAY_FRAMES ||
                    deltaTime < MIN_DELAY_MSECS
                ) {
                    return;
                }
            }
            this._lastUpdateFrameCount = this._frameCount;
            this._lastUpdateTimestamp = now;

            if (!spectatorPlayer.isValid()) {
                console.log("FollowPlayer: invalid specator");
                this.stop();
                return;
            }
            if (!followPlayer || !followPlayer.isValid()) {
                console.log("FollowPlayer: invalid follow player");
                this.stop();
                return;
            }

            const pos = followPlayer.getPosition();
            const rot = followPlayer.getRotation();

            spectatorPlayer.setPositionAndRotation(pos, rot);
        };
    }

    start() {
        if (this._screenUI) {
            world.addScreenUI(this._screenUI);
        }

        this._frameCount = 0;
        this._lastUpdateFrameCount = 0;
        this._lastUpdateTimestamp = 0;

        globalEvents.onTick.remove(this._onTickHandler);
        globalEvents.onTick.add(this._onTickHandler);
        return this;
    }

    stop() {
        if (this._screenUI) {
            world.removeScreenUI(this._screenUI);
        }

        globalEvents.onTick.remove(this._onTickHandler);
        return this;
    }

    _createScreenUI(spectatorPlayer, followPlayerIndex) {
        assert(spectatorPlayer instanceof Player);
        assert(typeof followPlayerIndex === "number");

        const playerDesks = world.TI4.getAllPlayerDesks();
        const followPlayerDesk = playerDesks[followPlayerIndex];
        const followPlayerSlot = followPlayerDesk
            ? followPlayerDesk.playerSlot
            : -1;
        const followPlayer = world.getPlayerBySlot(followPlayerSlot);
        const followPlayerName = followPlayer ? followPlayer.getName() : "N/A";
        const followPlayerColor = followPlayer
            ? followPlayerDesk.plasticColor
            : [1, 0, 0, 1];

        const button = WidgetFactory.button()
            .setFontSize(FONT_SIZE)
            .setBold(true)
            .setTextColor(followPlayerColor)
            .setText(locale("streamer.follow_camera", { followPlayerName }));
        button.onClicked.add((player, button) => {
            this.stop();
        });

        const buttonBox = WidgetFactory.layoutBox()
            .setPadding(BORDER_SIZE, BORDER_SIZE, BORDER_SIZE, BORDER_SIZE)
            .setChild(button);
        const buttonBorder = WidgetFactory.border()
            .setColor([1, 1, 1, 1])
            .setChild(buttonBox);

        // Then wrap in an outer border.  This is "the widget" to show.
        const outerBorderBox = WidgetFactory.layoutBox()
            .setPadding(BORDER_SIZE, BORDER_SIZE, BORDER_SIZE, BORDER_SIZE)
            .setChild(buttonBorder);
        const c = 0.02;
        const outerBorder = WidgetFactory.border()
            .setColor([c, c, c, 1])
            .setChild(outerBorderBox);

        // Screen UI can be placed and sized with relative values, but that
        // means UI will vary with screen size.  Since we cannot (yet) center
        // a fixed-size element, place a fixed-side box inside another.
        // This is definitely a hack.
        // This goes away when screen UI can be fixed size.
        const inner = WidgetFactory.layoutBox()
            .setOverrideWidth(WIDTH)
            .setChild(outerBorder);

        const outer = WidgetFactory.layoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(inner);

        const ui = WidgetFactory.screenUIElement();
        ui.relativeWidth = true;
        ui.width = 0.3; // if too small the WIDTH is reduced
        ui.relativeHeight = false;
        ui.height = HEIGHT;
        ui.relativePositionX = true;
        ui.positionX = (1 - ui.width) / 2;
        ui.relativePositionY = false;
        ui.positionY = SCREEN_X;
        ui.widget = outer;

        ui.players = new PlayerPermission().setPlayerSlots([
            spectatorPlayer.getSlot(),
        ]);

        return ui;
    }
}

module.exports = { FollowCamera };
