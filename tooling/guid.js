const uuid = require("uuid");

const [, , countParam] = process.argv;

let count = parseInt(countParam || "1");
if (isNaN(count)) {
    count = 1;
}

for (let i = 0; i < count; i++) {
    console.log(uuid.v4().replace(/-/g, "").toUpperCase());
}
