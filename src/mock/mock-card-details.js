class CardDetails {
    constructor(data) {
        this.flipped = (data && data.flipped) || false;
        this.index = (data && data.index) || 0;
        this.metadata = (data && data.metadata) || "";
        this.name = (data && data.name) || "";
        this.templateId = (data && data.templateId) || "";
        this.textureOverrideURL = (data && data.textureOverrideURL) || "";
    }
}

module.exports = CardDetails;
