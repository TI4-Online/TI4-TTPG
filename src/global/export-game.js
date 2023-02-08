const assert = require("../wrapper/assert-wrapper");
const { Broadcast } = require("../lib/broadcast");
const { Player, fetch, globalEvents, world } = require("../wrapper/api");
const { AsyncTaskQueue } = require("../lib/async-task-queue/async-task-queue");

const SEND_AS_FILE = true;

const COMMAND = "!export";
const LOCALHOST_POST = false;

const GAME_DATA_UPDATORS = [
    require("../lib/game-data/updator-config"),
    require("../lib/game-data/updator-decks"),
    require("../lib/game-data/updator-hex-summary"), // might be too concise?
    require("../lib/game-data/updator-laws"),
    require("../lib/game-data/updator-map-string"),
    require("../lib/game-data/updator-objectives"),
    require("../lib/game-data/updator-player-active"),
    require("../lib/game-data/updator-player-alliances"),
    require("../lib/game-data/updator-player-color"),
    require("../lib/game-data/updator-player-command-tokens"),
    require("../lib/game-data/updator-player-custodians"),
    require("../lib/game-data/updator-player-hand-cards"),
    require("../lib/game-data/updator-player-faction-name"),
    require("../lib/game-data/updator-player-leaders"),
    require("../lib/game-data/updator-player-name"),
    require("../lib/game-data/updator-player-planet-cards"),
    require("../lib/game-data/updator-player-relic-cards"),
    require("../lib/game-data/updator-player-score"),
    require("../lib/game-data/updator-player-strategy-cards"),
    require("../lib/game-data/updator-player-table-cards"),
    require("../lib/game-data/updator-player-tech"),
    require("../lib/game-data/updator-player-tgs"),
    require("../lib/game-data/updator-round"),
    require("../lib/game-data/updator-timestamp"),
    require("../lib/game-data/updator-turn"),
    require("../lib/game-data/updator-unpicked-strategy-cards"),
];

/**
 * Send "application/json" encoded message, appears in chat.
 *
 * @param {string} webhook
 * @param {string} message
 */
function sendMessageToDiscord(webhook, message) {
    assert(typeof webhook === "string");
    assert(typeof message === "string");
    assert(webhook.startsWith("https://discord.com/api/webhooks/"));

    console.log(`sendMessageToDiscord |${message.length}|`);

    // Prevent discord markdown.
    message = "`" + message + "`";

    // https://discord.com/developers/docs/resources/webhook#execute-webhook
    const fetchOptions = {
        headers: { "Content-Type": "application/json;charset=UTF-8" },
        body: JSON.stringify({ content: message }),
        method: "POST",
    };
    const promise = fetch(webhook, fetchOptions);
    promise.then((res) => console.log(JSON.stringify(res.json())));
}

/**
 * Send "multipart/form-data" encoded message, file linked in chat but not printed.
 *
 * @param {string} webhook
 * @param {string} message
 */
function sendFileToDiscord(webhook, message) {
    assert(typeof webhook === "string");
    assert(typeof message === "string");
    assert(webhook.startsWith("https://discord.com/api/webhooks/"));

    console.log(`sendFileToDiscord |${message.length}|`);

    // Encode as multipart form body.
    const boundary = "--boundary37c923cbd674951d";
    const crlf = "\n"; // DO NOT USE ACTUAL CRLF, ONLY USE EITHER (BOTH FAIL)
    message = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="payload_json"',
        "",
        `{"content": "TTPG export ${world.TI4.config.timestamp}"}`,
        `--${boundary}`,
        'Content-Disposition: form-data; name="files[0]"; filename="export.json"',
        "Content-Type: application/json",
        "",
        message,
        `--${boundary}--`,
    ].join(crlf);

    // https://discord.com/developers/docs/resources/webhook#execute-webhook
    const fetchOptions = {
        headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
        body: message,
        method: "POST",
    };

    const promise = fetch(webhook, fetchOptions);
    promise.then((res) => console.log(JSON.stringify(res.json())));
}

function gatherAndExport(webhook) {
    const playerDesks = world.TI4.getAllPlayerDesks();

    const data = {
        players: playerDesks.map((desk) => {
            return {};
        }),
    };
    for (const updator of GAME_DATA_UPDATORS) {
        updator(data);
    }

    const setupTimestamp = data.setupTimestamp;
    assert(typeof setupTimestamp === "number");

    const message = JSON.stringify(data);

    // Localhost dump of full data.
    if (LOCALHOST_POST) {
        const url = "http://localhost:8080/postkey_ttpg?key=export";
        const fetchOptions = {
            headers: { "Content-type": "application/json;charset=UTF-8" },
            body: JSON.stringify(data), // timestamp got added
            method: "POST",
        };
        const promise = fetch(url, fetchOptions);
        promise.then((res) => console.log(JSON.stringify(res.json())));
    }

    if (!webhook.startsWith("https://discord.com/api/webhooks/")) {
        Broadcast.chatAll("missing webhook");
        return;
    }

    if (SEND_AS_FILE) {
        sendFileToDiscord(webhook, message);
    } else {
        // Message size is limited to 2k characters.
        // Break up into chunks.
        let chunks = message.match(/(.|[\r\n]){1,1800}/g);

        // Prefix the game id (setup timestamp) and chunk index.
        chunks = chunks.map((chunk, index, array) => {
            return `[${setupTimestamp} ${index + 1}/${array.length}] ${chunk}`;
        });

        // Send one at a time.
        // Use async queue to spread out the load.
        const async = new AsyncTaskQueue(1000);
        for (const chunk of chunks) {
            async.add(() => {
                sendMessageToDiscord(webhook, chunk);
            });
        }
    }
}

function consider(player, message) {
    assert(player instanceof Player);
    assert(typeof message === "string");

    if (!message.startsWith(COMMAND)) {
        return;
    }

    const parts = message
        .split(" ")
        .map((s) => {
            return s.trim();
        })
        .filter((s) => {
            return s.length > 0;
        });
    if (parts[0] !== COMMAND || parts.length !== 2) {
        return;
    }
    const key = parts[1];

    const playerName = player.getName();
    Broadcast.broadcastAll(
        `${playerName} exporting game data, including hidden information`.toUpperCase()
    );

    gatherAndExport(key);
}

globalEvents.onChatMessage.add((player, message) => {
    consider(player, message);
});

globalEvents.onTeamChatMessage.add((player, team, message) => {
    consider(player, message);
});
