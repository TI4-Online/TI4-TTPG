class MockGameWorld {
    getExecutionReason() {
        return 'ScriptReload'
    }

    getAllObjects() {
        return []
    }
}

module.exports = {
    world : new MockGameWorld()
}