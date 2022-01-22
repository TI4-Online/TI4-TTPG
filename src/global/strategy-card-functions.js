/*
 *    Generic Scripting for Strategy Cards.
 *
 */


const tp = require('@tabletop-playground/api');
const { ObjectNamespace } = require('../lib/object-namespace');

globalEvents.TI4.onStrategyCardPlayed.add((card, player) => {
    const message = `${player.getName()} played card "${card.getTemplateName()}"`
    for (const p of world.getAllPlayers()) {
        p.showMessage(message)
    }
})


function setupStrategyCard(card) {
    // Setup the play button
    card.play_button = new tp.UIElement();
    card.play_button.position = new tp.Vector(3,-0.5,-0.2); 
    card.play_button.rotation = new tp.Rotator(180,180,0);  // THis makes it appear ont he back side only.
    card.play_button.widget = new tp.Button().setText("Play").setFontSize(10);
    card.play_button.widget.onClicked.add((button, play) => {globalEvents.TI4.onStrategyCardPlayed.trigger(button.getOwningObject(),play)}); // THe event is the button, so getOwningObject gets the card itself.
    card.addUI(card.play_button);

    card.addCustomAction("Play","Play this Strategy Card for your turn");

    card.onCustomAction.add((card, player, name) => {
        switch(name) {
            case 'Play':
                globalEvents.TI4.onStrategyCardPlayed.trigger(card,player);
                break;
        }
    });
}


// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isStrategyCard(obj)) {
        setupStrategyCard(obj);
    }
})

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === 'ScriptReload') {
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isStrategyCard(obj)) {
            setupStrategyCard(obj);
        }
    }
}




