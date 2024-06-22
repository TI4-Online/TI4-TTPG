const { Vector, world } = require("../../wrapper/api");
const { TableLayout } = require("../../table/table-layout");

/**
 * Events are a new card type Dane revealed after TI4 won the
 * 2023 BGG Geek Madness tournament.
 */
class SetupEvents {
    static getBoxPosition() {
        return TableLayout.anchorPositionToWorld(
            TableLayout.anchor.strategy,
            new Vector(-12, 0, 3)
        );
    }

    static setup() {
        console.log("SetupEvents.setup");

        const containerTemplateId = "A44BAA604E0ED034CD67FA9502214AA7";
        const templateIds = [
            "A5220F30274F0589DD00D591451242FF",
            "1AFC1A3766464E6BF97A1D83FA9A5935",
            "887B12591C46DB714B0BEABE7FF35D4E",
        ];

        const pos = SetupEvents.getBoxPosition();
        const box = world.createObjectFromTemplate(
            containerTemplateId,
            SetupEvents.getBoxPosition()
        );
        box.snapToGround();
        box.setName("Geek Madness Events");
        box.setDescription(
            [
                "Events are a new card type Dane",
                "revealed after TI4 won the 2024",
                "BGG Geek Madness tournament.",
            ].join("\n")
        );

        const above = pos.add(new Vector(0, 0, 6));
        for (const templateId of templateIds) {
            const obj = world.createObjectFromTemplate(templateId, above);
            box.addObjects([obj]);
        }
    }
}

module.exports = { SetupEvents };
