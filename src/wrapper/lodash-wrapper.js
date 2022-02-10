// Temporary workaround for node_modules require bug on MacOS
let lodash = false;
try {
    //lodash = require("lodash");
} catch {
    lodash = false;
}
if (!lodash) {
    try {
        lodash = require("../node_modules/lodash/lodash.js");
    } catch {
        // Another location for jest tests
        lodash = require("../../node_modules/lodash/lodash.js");
    }
}

//console.log(`LODASH ${typeof lodash}`)
module.exports = lodash;
