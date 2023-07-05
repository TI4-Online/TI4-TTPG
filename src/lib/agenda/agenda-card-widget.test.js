require("../../global");
const assert = require("assert");
const { AgendaCardWidget } = require("./agenda-card-widget");
const {
    ContentButton,
    ImageButton,
    ImageWidget,
    MockCard,
} = require("../../wrapper/api");

it("getImageWidget", () => {
    const nsid = "card.agenda:pok/articles_of_war";
    const card = MockCard.__create(nsid);
    const agendaCardWidget = AgendaCardWidget.getImageWidget(card);
    assert(agendaCardWidget instanceof ImageWidget);
});

it("getImageButton", () => {
    const nsid = "card.agenda:pok/articles_of_war";
    const card = MockCard.__create(nsid);
    const agendaCardWidget = AgendaCardWidget.getImageButton(card);
    assert(
        agendaCardWidget instanceof ImageButton ||
            agendaCardWidget instanceof ContentButton
    );
});
