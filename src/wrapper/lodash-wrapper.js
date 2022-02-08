// Temporary workaround for node_modules require bug on MacOS
let lodash;
try {
    lodash = require("lodash");
} catch {
    lodash = false;
}
if (!lodash) {
    lodash = require("../node_modules/lodash/lodash.js");
}
//console.log(`LODASH ${typeof lodash}`)
module.exports = lodash;
