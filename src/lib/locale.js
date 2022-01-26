const lang = require('./langdef');

const REPLACE_REGEX = /(?<!\\){(?!#)(.*?)(?<!\\)}/gm;
const PLURAL_REGEX = /(?<!\\){#(.*?)(?<!\\)}/gm;
const PLURAL_SEPERATOR = /(?<!\\)\|/gm;

const locale = (key, replacement = {}) => {
    const str = lang[key];
    if (!str) {
        return key;  // not registered, use key as stand-in
    } else if (!replacement) {
        return str;  // no need for regex
    }
    return str.replace(REPLACE_REGEX, (match) => {
        const r = replacement[match.substring(1, match.length - 1)];
        if (r === undefined) { return match; }
        return r;
    }).replace(PLURAL_REGEX, (match) => {
        const [val, singular, plural, zeroForm] = match.substring(2, match.length-1).split(PLURAL_SEPERATOR);
        const num = Number(replacement[val]);
        if (isNaN(num) || num === 0) { return zeroForm || plural; }
        if (num > 1) { return plural }
        return singular;
    });
}

module.exports = locale;
