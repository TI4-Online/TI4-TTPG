/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const tp = require('@tabletop-playground/api');

// TODO: make a central util for this kind of functionality
function broadcastMessage(message, player) {
    for (const p of world.getAllPlayers()) {
        p.sendChatMessage(message, player.getPlayerColor());
    }
}

function onTriggerPlay(button, player) {
    const card = button.getOwningObject();
    
    const message = `${player.getName()} played card "${card.getTemplateName()}"`;
    broadcastMessage(`>>> ${player.getName()} played card "${card.getTemplateName()}" <<<`, player);
    for (const p of world.getAllPlayers()) {
        p.showMessage(message);
    }

    card.onPlay(player);
}

function setupStrategyCard(card) {
    card.onTriggerPlay = onTriggerPlay;

    // Setup the play button
    card.play_button = new tp.UIElement();
    card.play_button.position = new tp.Vector(3,-0.5,-0.2); 
    card.play_button.rotation = new tp.Rotator(180,180,0);  // This makes it appear on the back side only.
    card.play_button.widget = new tp.Button().setText("Play").setFontSize(10);
    card.play_button.widget.onClicked.add(card.onTriggerPlay);
    card.addUI(card.play_button);

    card.addCustomAction("Play","Play this Strategy Card for your turn");

    card.onCustomAction.add((card, player, name) => {
        switch(name) {
            case 'Play':
                card.onPlay(card, player);
                break;
        }
    });
}

function addCloseButtons(widget, primaryWidget) { 
    addCloseButton(widget);
    if (primaryWidget) {
        addCloseButton(primaryWidget);
    }
}

function addCloseButton (widget) {
    let closeButton = new tp.Button()
        .setFontSize(10)
        .setText("Close");

    closeButton.onClicked.add(function (button, closingPlayer) {
        const owningObject = button.getOwningObject();
        //if (owningObject.getOwningPlayerSlot() === closingPlayer.getSlot()) {
            owningObject.onCloseDialog(closingPlayer);
            owningObject.destroy();
        /*} else {
            closingPlayer.sendMessage("not your selection!");
        }*/
    });
    widget.addChild(closeButton);
}

function createStragegyCardUi (widget, primaryWidget, activePlayer) {
    addCloseButtons(widget, primaryWidget);
    let offset = 0;

    for (const p of world.getAllPlayers()) {
        let item = world.createObjectFromTemplate("0C345E10BB53423086D6E6276988AEE6", new Vector(offset, 0, 90.5)); // slightly above a 90cm table
        item.setOwningPlayerSlot(p.getSlot());

        offset += 100;
        let ui = new tp.UIElement(); 
        let border = new tp.Border().setColor(p.getPlayerColor());
        border.setChild((primaryWidget && p === activePlayer) ? primaryWidget : widget);
        ui.useWidgetSize = false;
        ui.widget = border;
        ui.width = 350;
        ui.scale = 0.75;
        ui.position = new Vector(0, 0, 0.15);
        item.addUI(ui);
    } 
}

module.exports = {
    setupStrategyCard: setupStrategyCard,
    createStragegyCardUi: createStragegyCardUi,
    broadcastMessage: broadcastMessage
};
