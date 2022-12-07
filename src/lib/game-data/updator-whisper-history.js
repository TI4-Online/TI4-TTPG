const { WhisperHistory } = require("../whisper/whisper-history");

const MAX_WHISPER_PAIRS = 8;
const BUCKET_COUNT = 60;

module.exports = (data) => {
    data.whispers = [];

    const whisperPairs = WhisperHistory.getAllInUpdateOrder();
    if (whisperPairs.length > MAX_WHISPER_PAIRS) {
        whisperPairs.splice(MAX_WHISPER_PAIRS);
    }
    data.whispers = whisperPairs.map((whisperPair) => {
        const summary = whisperPair.getHistoryAsText(BUCKET_COUNT);
        return {
            colorNameA: summary.colorNameA,
            colorNameB: summary.colorNameB,
            forwardStr: summary.forwardStr,
            backwardStr: summary.backwardStr,
        };
    });
};
