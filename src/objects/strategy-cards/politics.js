const { AbstractStrategyCard } = require("./abstract-strategy-card");
const { refObject, Color } = require("../../wrapper/api");

new AbstractStrategyCard(refObject).setColor(new Color(0.639, 0.627, 0.027));
