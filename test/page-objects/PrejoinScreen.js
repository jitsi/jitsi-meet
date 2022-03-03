class PrejoinScreen {
    get PremeetingScreen() {
        const premeetingScreen = $('.premeeting-screen');
        return premeetingScreen
    };
    get PrejoinInput() {
        const prejoinInput = $('.prejoin-input-area input');
        return prejoinInput
    }
}

module.exports = new PrejoinScreen();