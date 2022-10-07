require("../../../global");
const { TabWhispers } = require("./tab-whispers");

it("constructor", () => {
    new TabWhispers();
});

it("update", () => {
    new TabWhispers().updateUI();
});
