function isCommandToken(obj) {
    const id = obj.getTemplateMetadata();
    return id.startsWith('token.command');
}

function isSystemTile(obj) {
    const id = obj.getTemplateMetadata();
    return id.startsWith('tile.system');
}

function isActivePlayer(player) {
    // TODO XXX NEED A TURN MANAGER!
    return true;
}

function isStrategyCard(obj) {
    const id = obj.getTemplateMetadata()
    return id.startsWith('card.strategy')
}

module.exports.isCommandToken = isCommandToken;
module.exports.isSystemTile = isSystemTile;
module.exports.isActivePlayer = isActivePlayer;
module.exports.isStrategyCard = isStrategyCard;