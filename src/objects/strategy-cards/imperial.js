const { AbstractStrategyCard } = require("./abstract-strategy-card");
const { refObject, Color } = require("../../wrapper/api");

new AbstractStrategyCard(refObject).setColor(new Color(0.317, 0.082, 0.403));
