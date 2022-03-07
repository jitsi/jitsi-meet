/**
 * Define prejoinscreen elements.
*/
class PrejoinScreen {

    // Premeeting screen object.
    get PremeetingScreen() {
        const premeetingScreen = $('.premeeting-screen');
        return premeetingScreen
    };

    // Prejoin input object.
    get PrejoinInput() {
        const prejoinInput = $('.prejoin-input-area input');
        return prejoinInput
    }
}

module.exports = new PrejoinScreen();