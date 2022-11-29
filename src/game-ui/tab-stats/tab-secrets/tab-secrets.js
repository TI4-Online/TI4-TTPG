const { TabSecretsUI } = require("./tab-secrets-ui");
const { Card, world } = require("../../../wrapper/api");
const { ObjectNamespace } = require("../../../lib/object-namespace");

/**
 * Show scored / available secrets.
 */
class TabSecrets {
    static getAllSecretNames() {
        const result = new Set();
        const nsidType = "card.objective.secret";
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            if (obj.getStackSize() === 1) {
                // Single card.
                const nsid = ObjectNamespace.getNsid(obj);
                if (nsid.startsWith(nsidType)) {
                    const cardDetails = obj.getCardDetails();
                    result.add(cardDetails.name);
                }
            } else {
                // Deck.
                const nsids = ObjectNamespace.getDeckNsids(obj);
                nsids.forEach((nsid, index) => {
                    if (nsid.startsWith(nsidType)) {
                        const cardDetails = obj.getCardDetails(index);
                        result.add(cardDetails.name);
                    }
                });
            }
        }
        return Array.from(result).sort();
    }

    static getScoredSecretNames() {
        const result = new Set();
        const nsidType = "card.objective.secret";
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            if (obj.getStackSize() > 1) {
                continue; // deck
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsid.startsWith(nsidType)) {
                continue; // not a secret
            }
            if (!obj.isInHolder()) {
                continue; // loose on table
            }
            const owner = obj.getHolder().getOwningPlayerSlot();
            if (owner >= 0) {
                continue; // player's hand
            }
            const cardDetails = obj.getCardDetails();
            result.add(cardDetails.name);
        }
        return Array.from(result).sort();
    }

    constructor() {
        this._tabSecretsUI = undefined;
    }

    getUI() {
        if (!this._tabSecretsUI) {
            this._tabSecretsUI = new TabSecretsUI();
        }
        this.updateUI();
        return this._tabSecretsUI.getWidget();
    }

    updateUI() {
        if (!this._tabSecretsUI) {
            return;
        }
        const allSecrets = TabSecrets.getAllSecretNames();
        const scoredSecrets = TabSecrets.getScoredSecretNames();
        this._tabSecretsUI.update(allSecrets, scoredSecrets);
    }
}

module.exports = { TabSecrets };
