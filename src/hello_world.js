const locale = require("lib/locale");

console.log(locale("example.helloworld"));

console.log(locale("example.replaced", { player: "ThatRobHuman", x: 5 }));
