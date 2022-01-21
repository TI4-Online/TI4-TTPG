/*
 *    Generic Scripting for Strategy Cards.
 *
 */


const tp = require('@tabletop-playground/api');

let isPlayed = false;


// This is the function called whenever a player activates the "play" feature.
function playStrategyCard(card, player) {
    // Ignore repeat plays
    if(isPlayed) {
        player.showMessage(`${card.getTemplateName()} has already been played.`);
        return;
    }
 
    isPlayed = true;
    // Set text to Played
    play_button.widget.setText("Played")
    play_button.widget.setTextColor(new tp.Color(0.4,0.4,0.4))

    const message = `${player.getName()} played card "${card.getTemplateName()}"`
    for (const p of world.getAllPlayers()) {
        p.showMessage(message)
    }
}


// Reset the card to a playable state
function resetStrategyCard(card) {
    isPlayed = false;
    play_button.widget.setText("Play")
    play_button.widget.setTextColor(new tp.Color(1,1,1))
}

// Setup the play button
let play_button = new tp.UIElement();
play_button.position = new tp.Vector(3,-0.5,-0.2); 
play_button.rotation = new tp.Rotator(180,180,0);  // THis makes it appear ont he back side only.
play_button.widget = new tp.Button().setText("Play").setFontSize(10);
play_button.widget.onClicked.add((button, play) => {playStrategyCard(button.getOwningObject(),play)}); // THe event is the button, so getOwningObject gets the card itself.
refObject.addUI(play_button);

refObject.addCustomAction("Play","Play this Strategy Card for your turn");
refObject.addCustomAction("Reset","Reset this Strategy Card to a playable state");

refObject.onCustomAction.add((card, player, name) => {
    switch(name) {
        case 'Play':
            playStrategyCard(card,player);
            break;
        case 'Reset':
            resetStrategyCard(card);
            break;
    }
});


