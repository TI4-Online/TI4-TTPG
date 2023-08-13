const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    DrawingLine,
    GameObject,
    Rotator,
    Text,
    UIElement,
    Vector,
    globalEvents,
    refObject,
    refPackageId,
    world,
} = require("../../wrapper/api");

class AgendaPredictionsMat {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;

        const handleAgendaChanged = () => {
            this.handleAgendaChanged();
        };
        const handleAgendaPlayerStateChanged = () => {
            this.handleAgendaPlayerStateChanged();
        };
        globalEvents.TI4.onAgendaChanged.add(handleAgendaChanged);
        globalEvents.TI4.onAgendaPlayerStateChanged.add(
            handleAgendaPlayerStateChanged
        );
        refObject.onDestroyed.add(() => {
            globalEvents.TI4.onAgendaChanged.remove(handleAgendaChanged);
            globalEvents.TI4.onAgendaPlayerStateChanged.remove(
                handleAgendaPlayerStateChanged
            );
        });

        this._update();
    }

    handleAgendaChanged() {
        console.log("AgendaPredictionsMat.handleAgendaChanged");
        this._update();
    }

    handleAgendaPlayerStateChanged() {
        console.log("AgendaPredictionsMat.handleAgendaPlayerStateChanged");
        this._update();
    }

    _update() {
        for (const line of this._obj.getDrawingLines()) {
            this._obj.removeDrawingLineObject(line);
        }
        for (const ui of this._obj.getAttachedUIs()) {
            this._obj.removeUIElement(ui);
        }

        // Get extent AFTER removing everything (UI contributes).
        // The model has a raised collider, so UI/lines directly on the surface
        // won't z-fight with the visible model top.
        const extent = this._obj.getExtent();

        // Segment into per-agenda-outcome areas.
        const numOutcomes = world.TI4.agenda.getNumOutcomes();

        if (numOutcomes > 1) {
            const matWidth = extent.y * 2;
            const segmentWidth = matWidth / numOutcomes;

            const normals = [new Vector(0, 0, 1)];
            const h = extent.x * 0.5;
            for (let i = 0; i < numOutcomes; i++) {
                const left = -(matWidth / 2) + i * segmentWidth;

                // Label.
                const label = new Text()
                    .setText(world.TI4.agenda.getOutcomeName(i))
                    .setFontSize(10);
                const ui = new UIElement();
                ui.anchorY = 0;
                ui.position = new Vector(
                    extent.x,
                    left + segmentWidth / 2,
                    extent.z
                );
                ui.rotation = new Rotator(0, 0, 0);
                ui.widget = label;
                this._obj.addUI(ui);

                // Divider.
                if (i > 0) {
                    const y = left;
                    const line = new DrawingLine();
                    line.points = [
                        new Vector(-h, y, extent.z),
                        new Vector(h, y, extent.z),
                    ];
                    line.normals = normals;
                    line.color = [1, 1, 1, 1];
                    line.rounded = false;
                    line.thickness = 0.3;
                    this._obj.addDrawingLine(line);
                }
            }
        }

        const title = new Text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setText(locale("mat.title.predictions").toUpperCase())
            .setFontSize(12);
        const ui = new UIElement();
        ui.anchorY = 1;
        ui.position = new Vector(-extent.x, 0, extent.z);
        ui.rotation = new Rotator(0, 0, 0);
        ui.widget = title;
        this._obj.addUI(ui);
    }
}

new AgendaPredictionsMat(refObject);
