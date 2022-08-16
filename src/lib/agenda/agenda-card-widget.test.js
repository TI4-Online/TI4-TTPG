const assert = require("assert");
const { AgendaCardWidget } = require("./agenda-card-widget");

it("constructor", () => {
    const nsid = "card.agenda:pok/articles_of_war";
    const agendaCardWidget = new AgendaCardWidget(nsid);
    assert(agendaCardWidget);
});
