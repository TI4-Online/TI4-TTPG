const assert = require("assert");
const { AgendaCardWidget } = require("./agenda-card-widget");
const { MockCard } = require("../../wrapper/api");

it("constructor", () => {
    const nsid = "card.agenda:pok/articles_of_war";
    const card = MockCard.__create(nsid);
    const agendaCardWidget = new AgendaCardWidget(card);
    assert(agendaCardWidget);
});
